import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";
import mammoth from "mammoth";
import streamBuffers from "stream-buffers";

// Mesma importação do pdf-parse
let pdfParse;
try {
  const pdfModule = await import("pdf-parse");
  pdfParse = pdfModule.default;
} catch (error) {
  try {
    const pdfModule = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = pdfModule.default;
  } catch (error2) {
    if (typeof require !== "undefined") {
      pdfParse = require("pdf-parse");
    } else {
      throw new Error("pdf-parse não pôde ser carregado");
    }
  }
}

export async function POST(req) {
  try {
    const { originalUrl, adaptedQuestions } = await req.json();

    if (!originalUrl || !adaptedQuestions) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    // 1️⃣ Baixa o arquivo original
    const response = await fetch(originalUrl);
    if (!response.ok) throw new Error("Falha ao baixar o arquivo original.");

    const buffer = Buffer.from(await response.arrayBuffer());
    let originalText = "";

    // 2️⃣ Extrai texto
    if (originalUrl.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      originalText = data.text;
    } else if (originalUrl.endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({ buffer });
      originalText = value;
    } else {
      return NextResponse.json(
        { error: "Formato não suportado." },
        { status: 400 }
      );
    }

    // 3️⃣ Divide em linhas e substitui APENAS questões
    const lines = originalText.split(/\r?\n/);
    let questionIndex = 0;

    const adaptedLines = lines.map((line) => {
      // Verifica se é uma questão
      const isQuestion = line.match(/^\d+[\)\.]\s*.+/);

      if (isQuestion && questionIndex < adaptedQuestions.length) {
        const adapted = adaptedQuestions[questionIndex];
        questionIndex++;
        return adapted;
      }
      return line; // Mantém tudo else intacto
    });

    // 4️⃣ Gera novo PDF
    const outputBuffer = new streamBuffers.WritableStreamBuffer();
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    doc.pipe(outputBuffer);

    // Configurações TDAH
    const fontSize = 14;
    const lineHeight = 1.6;

    // Reconstrói o PDF
    for (const line of adaptedLines) {
      if (line.trim() === "") {
        doc.moveDown(0.5);
        continue;
      }

      const isQuestion = line.match(/^\d+[\)\.]\s*.+/);

      if (isQuestion) {
        doc.moveDown(1);
        doc
          .font("Helvetica-Bold")
          .fontSize(fontSize)
          .text(line, {
            align: "left",
            lineGap: lineHeight * 2,
          });
      } else {
        doc
          .font("Helvetica")
          .fontSize(fontSize)
          .text(line, {
            align: "left",
            lineGap: lineHeight * 1.5,
          });
      }

      doc.moveDown(0.3);
    }

    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = outputBuffer.getContents();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=prova_adaptada.pdf",
      },
    });
  } catch (err) {
    console.error("Erro na geração de PDF:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao gerar PDF adaptado." },
      { status: 500 }
    );
  }
}
