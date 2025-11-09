import { NextResponse } from "next/server";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

async function readFileFromFormData(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) throw new Error("Nenhum arquivo recebido.");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    buffer,
    fileName: file.name,
    contentType: file.type || "application/pdf",
  };
}

function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const text = pdfData.Pages.map((page) =>
          page.Texts?.map((t) =>
            decodeURIComponent(t.R?.map((r) => r.T || "").join(" "))
          ).join(" ")
        )
          .join("\n")
          .replace(/\s{2,}/g, " ")
          .trim();
        resolve(text);
      } catch {
        reject(new Error("Erro ao extrair texto do PDF."));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

function extractQuestions(text) {
  const cleanText = text
    .replace(/^.*?(Tempo:|Instruções:|Avaliação:).*?\n/gi, "")
    .replace(/jsPDF.*?$/, "")
    .trim();

  const questionSplit = cleanText.split(/(?=\d+\s*[\)\.]\s+)/g);

  const questions = questionSplit
    .map((q) => q.trim())
    .filter((q) => q.match(/^\d+\s*[\)\.]/) && q.length > 10)
    .map((q, i) => ({
      id: `q${i + 1}`,
      text: q,
    }));

  return questions;
}

export async function POST(req) {
  try {
    const { buffer, fileName, contentType } = await readFileFromFormData(req);

    let extractedText = "";

    if (contentType.includes("pdf")) {
      extractedText = await extractTextFromPDF(buffer);
    } else if (
      contentType.includes("word") ||
      contentType.includes("officedocument")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: `Formato não suportado: ${contentType}.` },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: "Texto muito curto ou não foi possível extrair conteúdo." },
        { status: 400 }
      );
    }

    const questions = extractQuestions(extractedText);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão detectada." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      originalQuestions: questions,
      fullText: extractedText,
      originalUrl: null, // ✅ deixado opcional pra uso futuro
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "API parse-file operacional" });
}
