import { NextResponse } from "next/server";
import { CohereClient } from "cohere-ai";
import PDFParser from "pdf2json";

// Inicializa o cliente Cohere corretamente
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Função para extrair texto com pdf2json
    const extractTextFromPDF = () =>
      new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (errData) => {
          console.error("Erro pdf2json:", errData.parserError);
          reject(new Error("Falha ao ler PDF."));
        });

        pdfParser.on("pdfParser_dataReady", () => {
          const text = pdfParser.getRawTextContent();
          if (!text || !text.trim()) {
            console.warn("⚠️ Texto vazio extraído.");
            reject(new Error("Texto vazio extraído."));
          } else {
            resolve(text);
          }
        });

        pdfParser.parseBuffer(buffer);
      });

    const textoExtraido = await extractTextFromPDF();

    console.log("✅ Texto extraído (amostra):", textoExtraido.slice(0, 200));

    // Gera a adaptação com Cohere
    const response = await cohere.generate({
      model: "command-r-plus",
      prompt: `
Você é um assistente educacional especializado em adaptar provas para jovens adultos e universitários com TDAH.

Sua tarefa é ADAPTAR APENAS OS ENUNCIADOS das questões de uma prova, seguindo as regras abaixo:
- Destaque palavras importantes em **negrito** (como "Assinale", "Indique", "Explique", "Metáfora", etc).
- Aumente a legibilidade e clareza, mantendo o mesmo sentido.
- Simplifique palavras difíceis quando possível (ex: "indique" → "mostre").
- NÃO modifique o texto base das questões (textos literários, científicos, etc.).
- NÃO altere alternativas (a, b, c, d).
- Apenas modifique e destaque o ENUNCIADO das questões.
- Mantenha a numeração e as alternativas intactas.
- Adicione espaçamento entre linhas e blocos de texto (use quebras de linha extras).
- Retorne o resultado no mesmo formato textual, pronto para exibição.

Aqui está o conteúdo original da prova:
${textoExtraido}

Agora devolva a versão ADAPTADA:
      `,
      max_tokens: 1000,
    });

    const adaptedText = response.generations?.[0]?.text?.trim();
    if (!adaptedText) {
      return NextResponse.json(
        { error: "Falha ao gerar texto adaptado." },
        { status: 500 }
      );
    }

    return NextResponse.json({ adaptedText });
  } catch (error) {
    console.error("❌ Erro no /api/adapt:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}