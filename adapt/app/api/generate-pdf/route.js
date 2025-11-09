import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";
import streamBuffers from "stream-buffers";

// fallback seguro para pdf-parse
let pdfParse;
try {
  const mod = await import("pdf-parse");
  pdfParse = mod.default || mod;
} catch (e) {
  console.error("Erro ao importar pdf-parse:", e);
  throw e;
}

// --- Helper: quebra por bold ---
function tokenizeForBold(originalLine, adaptedLine) {
  if (/\*\*(.+?)\*\*/.test(adaptedLine)) {
    const parts = [];
    let rest = adaptedLine;
    const re = /\*\*(.+?)\*\*/;
    while (re.test(rest)) {
      const m = re.exec(rest);
      const before = rest.slice(0, m.index);
      if (before) parts.push({ text: before, bold: false });
      parts.push({ text: m[1], bold: true });
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) parts.push({ text: rest, bold: false });
    return parts;
  }

  // fallback
  const origWords = new Set(
    (originalLine || "")
      .toLowerCase()
      .replace(/[^\w\sÀ-Úà-ú-]/g, "")
      .split(/\s+/)
  );
  const words = adaptedLine.split(/(\s+)/);
  return words.map((w) => {
    const isSpace = /^\s+$/.test(w);
    if (isSpace) return { text: w, bold: false };
    const key = w.toLowerCase().replace(/[^\wÀ-Úà-ú-]/g, "");
    const bold = key && !origWords.has(key) && key.length > 2;
    return { text: w, bold };
  });
}

// --- POST ---
export async function POST(req) {
  try {
    const { originalUrl, adaptedQuestions } = await req.json();

    if (!originalUrl || !adaptedQuestions) {
      return NextResponse.json(
        { error: "originalUrl e adaptedQuestions são obrigatórios" },
        { status: 400 }
      );
    }

    const res = await fetch(originalUrl);
    if (!res.ok) throw new Error("Falha ao baixar o arquivo original.");
    const buffer = Buffer.from(await res.arrayBuffer());

    const parsed = await pdfParse(buffer);
    const text = parsed?.text || "";
    if (!text || text.trim().length < 5) {
      throw new Error("Não foi possível extrair texto do PDF original.");
    }

    const lines = text.split(/\r?\n/);
    const isQuestionLine = (l) => /^\s*\d+\s*[\)\.]\s+/.test(l);

    let questionIndex = 0;
    const resultLines = lines.map((line) => {
      if (isQuestionLine(line) && questionIndex < adaptedQuestions.length) {
        const adapted = adaptedQuestions[questionIndex];
        questionIndex++;
        return { type: "question", original: line, adapted };
      }
      return { type: "other", text: line };
    });

    // --- Criação do PDF ---
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const outBuffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(outBuffer);

    const normalFontSize = 13;
    const questionFontSize = 14;
    const lineGap = 8;

    function drawLine(parts, size) {
      const startX = doc.x;
      let x = startX;
      const y = doc.y;
      parts.forEach((p) => {
        doc
          .font(p.bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(size)
          .fillColor("black")
          .text(p.text, x, y, { lineBreak: false });
        const w = doc.widthOfString(p.text);
        x += w;
        doc.x = x;
      });
      doc.moveDown(0);
      doc.x = startX;
      doc.y = y + size + lineGap / 2;
    }

    for (const item of resultLines) {
      if (item.type === "other") {
        doc.font("Helvetica").fontSize(normalFontSize).fillColor("black");
        doc.text(item.text || "", { lineGap });
      } else if (item.type === "question") {
        const parts = tokenizeForBold(item.original, item.adapted);
        drawLine(parts, questionFontSize);
      }

      if (doc.y > 720) {
        doc.addPage();
        doc.font("Helvetica").fontSize(normalFontSize);
      }
    }

    doc.end();
    await new Promise((resolve) => doc.on("finish", resolve));
    const pdfBuf = outBuffer.getContents();

    return new NextResponse(pdfBuf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="prova_adaptada.pdf"',
      },
    });
  } catch (err) {
    console.error("❌ Erro em /api/generate-pdf:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
