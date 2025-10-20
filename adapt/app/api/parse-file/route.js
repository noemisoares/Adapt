import { NextResponse } from "next/server";
import PDFParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

export const config = {
  api: {
    bodyParser: false, // vamos ler o arquivo 
  },
};

async function getBufferFromRequest(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req) {
  try {
    const buffer = await getBufferFromRequest(req);

    const contentType = req.headers.get("content-type") || "";
    let extractedText = "";

    if (contentType.includes("application/pdf")) {
      const data = await PDFParse(buffer);
      extractedText = data.text;
    } else if (
      contentType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (contentType.startsWith("image/")) {
      const { data } = await Tesseract.recognize(buffer);
      extractedText = data.text;
    } else {
      return NextResponse.json(
        { error: "Formato de arquivo não suportado." },
        { status: 400 }
      );
    }

    // separa as questões
    const questoes = extractedText
      .split(/(?:Quest(ão|ao)\s*\d+[:.)\s]+)/i)
      .filter((q) => q.trim().length > 0)
      .map((q, i) => ({
        id: `q${i + 1}`,
        text: q.trim(),
      }));

    return NextResponse.json({ originalQuestions: questoes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
