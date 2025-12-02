import { NextResponse } from "next/server";
import { CohereClient } from "cohere-ai";
import PDFParser from "pdf2json";

import Parse from "@/app/back4app/parseConfig"; //

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// ---- Função para extrair texto do PDF ----
async function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => {
      console.error("❌ Erro no pdf2json:", err.parserError);
      reject(new Error("Falha ao processar PDF"));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const text = pdfData.Pages.map((page) =>
          page.Texts?.map((t) =>
            decodeURIComponent(t.R?.map((r) => r.T || "").join(" ") || "")
          ).join(" ")
        )
          .join("\n")
          .replace(/\s{2,}/g, " ")
          .trim();

        if (!text || text.length < 20) {
          reject(new Error("Texto insuficiente extraído do PDF."));
        } else {
          resolve(text);
        }
      } catch (err) {
        reject(new Error("Erro ao ler texto do PDF."));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

// ---- Rota principal ----
export async function POST(req) {
  try {
    const body = await req.json();
    const { base64Content, url } = body;

    if (!base64Content && !url) {
      return NextResponse.json(
        { error: "Nenhum conteúdo recebido. Envie base64Content ou url." },
        { status: 400 }
      );
    }

    let extractedText = "";
    if (base64Content) {
      const buffer = Buffer.from(base64Content, "base64");
      extractedText = await extractTextFromPDF(buffer);
    } else if (url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao baixar arquivo.");
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      extractedText = await extractTextFromPDF(buffer);
    }

    if (!extractedText) throw new Error("Não foi possível extrair o texto.");

    console.log("✅ Texto extraído (amostra):", extractedText.slice(0, 300));

    // ---- Envia para o Cohere (modelo atualizado e robusto) ----
    const response = await cohere.chat({
      model: "command-r-08-2024",
      message: `
Você é um assistente educacional especializado em adaptar provas para estudantes com TDAH.

Adapte APENAS os ENUNCIADOS das questões. Siga as regras:

- Destaque palavras importantes em **negrito** (ex: "Assinale", "Explique", "Metáfora").
- Simplifique termos complexos, mas mantenha o significado.
- NÃO altere o texto base nem as alternativas.
- Mantenha numeração e estrutura das questões.
- Use espaçamento e quebras de linha para melhor leitura.
- Retorne apenas o texto adaptado, em formato Markdown.

Prova original:
${extractedText}
      `,
      temperature: 0.6,
    });

    // Compatibilidade com diferentes formatos de resposta da API
    const adaptedText =
      response?.text?.trim() ||
      response?.message?.content?.[0]?.text?.trim() ||
      response?.generations?.[0]?.text?.trim();

    if (!adaptedText) {
      throw new Error("A IA não retornou um texto adaptado válido.");
    }

    // ---- Quebra automática das questões adaptadas ----
    const adaptedQuestions = adaptedText
      .split(/\n(?=\d+\s*[\.\)])/) // quebra por numeração
      .map((q) => q.trim())
      .filter(Boolean);

    const adapted = {
      questoes: adaptedQuestions.map((adaptada, i) => ({
        original: `Questão ${i + 1}`,
        adaptada,
      })),
      adaptedQuestions,
      adaptedText,
    };

    console.log("✅ Adaptação concluída com sucesso!");

    //
    try {
      // ID da prova enviado pelo frontend
      const { provaId } = body;

      if (provaId) {
        const Prova = Parse.Object.extend("Provas");
        const query = new Parse.Query(Prova);

        const prova = await query.get(provaId);

        // Salvar o texto adaptado como arquivo .txt (ou .md)
        const adaptedFile = new Parse.File("prova_adaptada.txt", {
          base64: Buffer.from(adaptedText).toString("base64"),
        });

        await adaptedFile.save();

        // Atualizar o objeto Prova
        prova.set("arquivoAdaptado", adaptedFile);
        prova.set("arquivoAdaptadoUrl", adaptedFile.url());
        prova.set("adaptedText", adaptedText);

        await prova.save();

        console.log("📌 Prova adaptada salva com sucesso no Back4App!");
      }
    } catch (e) {
      console.error("Erro ao salvar prova adaptada:", e);
    }
    //

    return NextResponse.json({ adapted });
  } catch (error) {
    console.error("❌ Erro no /api/adapt:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
