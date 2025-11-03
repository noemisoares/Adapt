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
    contentType: file.type || "application/octet-stream",
  };
}

function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (err) => {
        console.error("❌ Erro no pdf2json:", err.parserError);
        reject(new Error("Falha ao processar PDF"));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          const text = pdfData.Pages.map(
            (page) =>
              page.Texts?.map((t) =>
                decodeURIComponent(t.R?.map((r) => r.T || "").join(" ") || "")
              ).join(" ") || ""
          ).join("\n");

          console.log(`✅ PDF processado: ${pdfData.Pages.length} páginas`);
          resolve(text);
        } catch (parseError) {
          reject(new Error("Erro ao extrair texto do PDF"));
        }
      });

      pdfParser.parseBuffer(buffer);
    } catch (err) {
      reject(new Error("Erro no parser de PDF"));
    }
  });
}

// FUNÇÃO MELHORADA PARA DETECTAR QUESTÕES
function extractQuestions(text) {
  console.log("🔍 Analisando texto para extrair questões...");

  // Remove cabeçalhos comuns
  const cleanText = text
    .replace(/^.*?(Tempo:|Instruções:|Avaliação:).*?\n/gi, "")
    .replace(/jsPDF.*?$/, "") // Remove rodapé do jsPDF
    .trim();

  // Divisão MELHORADA - apenas onde realmente começa uma questão
  const questionSplit = cleanText.split(/(?=\d+[\)\.]\s+)/g);

  const questions = questionSplit
    .map((q) => q.trim())
    .filter((q) => {
      // Filtra apenas questões válidas
      return (
        q.length > 10 &&
        q.match(/^\d+[\)\.]\s+/) && // Começa com número seguido de ) ou .
        !q.match(/^[^\)]*$/) && // Deve ter o fechamento de parêntese
        q.length < 1000
      ); // Não pode ser muito longo (provavelmente junção errada)
    })
    .map((q, i) => ({
      id: `q${i + 1}`,
      text: q,
    }));

  console.log(`✅ ${questions.length} questões extraídas`);

  return questions;
}

export async function POST(req) {
  try {
    const { buffer, fileName, contentType } = await readFileFromFormData(req);
    console.log("📄 Processando arquivo:", fileName, "Tipo:", contentType);

    let extractedText = "";

    if (contentType.includes("pdf")) {
      console.log("🔍 Extraindo texto do PDF com pdf2json...");
      extractedText = await extractTextFromPDF(buffer);
    } else if (
      contentType.includes("word") ||
      contentType.includes("officedocument")
    ) {
      console.log("🔍 Extraindo texto do DOCX com mammoth...");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: `Formato não suportado: ${contentType}. Use PDF ou DOCX.` },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair texto do arquivo. Pode estar vazio ou corrompido.",
        },
        { status: 400 }
      );
    }

    console.log(
      "📝 Texto extraído (amostra):",
      extractedText.substring(0, 300)
    );

    // Extrai questões com a função melhorada
    const questions = extractQuestions(extractedText);

    if (questions.length === 0) {
      console.log(
        "⚠️ Nenhuma questão detectada. Texto completo:",
        extractedText
      );
      return NextResponse.json(
        { error: "Nenhuma questão detectada no formato esperado." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      originalQuestions: questions,
      debug: {
        textLength: extractedText.length,
        questionsFound: questions.length,
      },
    });
  } catch (err) {
    console.error("❌ Erro ao processar arquivo:", err);
    return NextResponse.json(
      { error: "Erro interno: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "API parse-file funcionando com pdf2json",
    status: "operacional",
  });
}
