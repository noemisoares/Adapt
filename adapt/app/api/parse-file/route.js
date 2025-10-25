import { NextResponse } from "next/server";
import { createRequire } from "module";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

async function readFileFromFormData(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) throw new Error("Nenhum arquivo recebido.");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { buffer, contentType: file.type || "application/octet-stream" };
}

function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const text = pdfData.Pages.map((page) =>
          page.Texts.map((t) =>
            decodeURIComponent(t.R.map((r) => r.T).join(" "))
          ).join(" ")
        ).join("\n");
        resolve(text);
      });
      pdfParser.parseBuffer(buffer);
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(req) {
  try {
    const { buffer, contentType } = await readFileFromFormData(req);
    console.log("📄 Tipo de arquivo recebido:", contentType);

    let extractedText = "";

    if (contentType.includes("pdf")) {
      extractedText = await extractTextFromPDF(buffer);
    } else if (
      contentType.includes("word") ||
      contentType.includes("officedocument")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (contentType.startsWith("image/")) {
      const { data } = await Tesseract.recognize(buffer);
      extractedText = data.text;
    } else {
      return NextResponse.json(
        { error: `Formato de arquivo não suportado: ${contentType}` },
        { status: 400 }
      );
    }

    const textWithoutHeader = extractedText.replace(/^.*?Tempo:.*?\n/, "");

    const questoes = textWithoutHeader
  // Quebra tanto com \n1) quanto com espaço1)
      .split(/(?:^|\s)(?=\d+\s*[).]\s*)/g)
      .filter((q) => q.trim().length > 0)
      .map((q, i) => ({
        id: `q${i + 1}`,
        text: q.trim(),
      }));

    console.log("✅ Questões extraídas:", questoes.length);

    return NextResponse.json({ originalQuestions: questoes });
  } catch (err) {
    console.error("❌ Erro ao processar arquivo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Rota /api/parse-file funcional (Node, pdf2json)",
  });
}
