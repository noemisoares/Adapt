import { NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
import fetch from "node-fetch";
import PDFParser from "pdf2json";

// Cliente OpenAI (se disponível)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ FUNÇÃO DE EXTRAÇÃO DO PARSE-FILE (FUNCIONAL)
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

          console.log(
            `✅ PDF processado no adapt: ${pdfData.Pages.length} páginas`
          );
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

// ✅ FUNÇÃO DE DETECÇÃO DE QUESTÕES (IGUAL AO PARSE-FILE)
function extractQuestions(text) {
  console.log("🔍 Analisando texto para extrair questões...");

  // Remove cabeçalhos
  const cleanText = text
    .replace(/^.*?(Tempo:|Instruções:|Avaliação:).*?\n/gi, "")
    .replace(/jsPDF.*?$/, "")
    .trim();

  // Divisão FUNCIONAL - igual ao parse-file original
  const questions = cleanText
    .split(/(?:^|\s)(?=\d+\s*[).]\s*)/g)
    .filter((q) => q.trim().length > 0)
    .map((q) => q.trim())
    .filter((q) => q.length > 10);

  console.log(`✅ ${questions.length} questões detectadas no adapt`);

  return questions;
}

// ✅ ADAPTADOR LOCAL INTELIGENTE (FALLBACK)
function adaptQuestionsLocally(questions) {
  console.log("🔧 Aplicando adaptação local para TDAH...");

  return questions.map((question, index) => {
    let adapted = question;

    // 1. DESTACA VERBOS IMPORTANTES EM NEGRITO
    adapted = adapted.replace(
      /\b(defina|descreva|explique|calcule|responda|identifique|analise|compare|justifique|enumere|diferencie|caracterize|apresente|marque|assinale|selecione)\b/gi,
      "**$1**"
    );

    // 2. DESTACA TERMOS TÉCNICOS EM NEGRITO
    adapted = adapted.replace(
      /\b(árvore binária|travessia|em ordem|pré-ordem|pós-ordem|nó|raiz|folha|altura|profundidade|balanceamento|BST|binária|propriedade|básica|estrutura|dados|algoritmo|implemente|função|método|classe|objeto|variável|constante|loop|condicional|recursão|iteração)\b/gi,
      "**$1**"
    );

    // 3. DESTACA PALAVRAS-CHAVE GERAIS
    adapted = adapted.replace(
      /\b(importante|atenção|obrigatório|essencial|crucial|fundamental|chave|principal|conclusão|resumo|objetivo|meta|finalidade)\b/gi,
      "**$1**"
    );

    // 4. SIMPLIFICA INSTRUÇÕES COMPLEXAS
    adapted = adapted
      .replace(/elabore uma resposta detalhada/gi, "responda")
      .replace(/desenvolva um texto dissertativo/gi, "escreva")
      .replace(/justifique sua resposta/gi, "explique")
      .replace(/analise criticamente/gi, "analise")
      .replace(/caracterize detalhadamente/gi, "descreva")
      .replace(/leia atentamente o texto/gi, "leia o texto")
      .replace(/com base no texto acima/gi, "baseado no texto");

    // 5. ADICIONA QUEBRA PARA MELHOR LEGIBILIDADE
    adapted = adapted.replace(/([.!?])\s+/g, "$1\n\n");

    return {
      original: question,
      adaptada: adapted,
    };
  });
}

// ✅ TENTA CHAMAR A IA COM TIMEOUT E FALLBACK
async function tryOpenAIAdaptation(questions) {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => {
      console.log("⏰ Timeout da IA, usando fallback local");
      resolve(null);
    }, 10000); // 10 segundos timeout

    try {
      console.log("🤖 Tentando OpenAI...");

      const prompt = `
ADAPTE as seguintes questões de prova para estudantes com TDAH:

- **Destaque verbos em negrito**: defina, descreva, explique, calcule, etc.
- **Destaque termos técnicos em negrito**: árvore binária, travessia, nó, etc.
- **Simplifique instruções complexas**
- **Mantenha números, fórmulas e alternativas intactos**

QUESTÕES ORIGINAIS:
${JSON.stringify(questions, null, 2)}

Retorne APENAS JSON:
{
  "questoes": [
    {"original": "...", "adaptada": "..."}
  ]
}
`;

      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Você adapta questões para TDAH aplicando negrito em verbos e termos técnicos.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      clearTimeout(timeout);

      const responseText = completion.choices[0].message.content;
      console.log("✅ Resposta da IA recebida");

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const adaptedData = JSON.parse(jsonMatch[0]);
        console.log(
          `✅ IA adaptou ${adaptedData.questoes?.length || 0} questões`
        );
        resolve(adaptedData);
      } else {
        console.log("❌ Resposta da IA inválida");
        resolve(null);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.log("❌ Erro na IA:", error.message);
      resolve(null);
    }
  });
}

export async function POST(req) {
  try {
    const { url, base64Content, fileName } = await req.json();

    let text = "";

    if (url) {
      console.log("🔗 Processando arquivo por URL:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha ao baixar o arquivo");

      const buffer = Buffer.from(await response.arrayBuffer());

      if (url.endsWith(".pdf")) {
        text = await extractTextFromPDF(buffer);
      } else if (url.endsWith(".docx")) {
        const { value } = await mammoth.extractRawText({ buffer });
        text = value;
      }
    } else if (base64Content && fileName) {
      console.log("🔗 Processando arquivo por base64:", fileName);
      const buffer = Buffer.from(base64Content, "base64");

      if (fileName.endsWith(".pdf")) {
        text = await extractTextFromPDF(buffer);
      } else if (fileName.endsWith(".docx")) {
        const { value } = await mammoth.extractRawText({ buffer });
        text = value;
      }
    } else {
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto suficiente do arquivo" },
        { status: 400 }
      );
    }

    console.log("📝 Texto extraído:", text.substring(0, 500));

    // 🔹 DETECTA QUESTÕES
    const questions = extractQuestions(text);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão detectada no arquivo" },
        { status: 400 }
      );
    }

    console.log(`🎯 ${questions.length} questões para adaptar`);

    // 🔹 TENTA IA PRIMEIRO, DEPOIS FALLBACK
    let adaptedData;
    let source = "local"; // default

    // Tenta OpenAI se a API key existir
    if (process.env.OPENAI_API_KEY) {
      adaptedData = await tryOpenAIAdaptation(questions);
      if (adaptedData) {
        source = "openai";
      }
    }

    // Se IA falhou ou não disponível, usa fallback local
    if (!adaptedData) {
      adaptedData = {
        questoes: adaptQuestionsLocally(questions),
      };
      source = "local";
    }

    console.log(`✅ Adaptação concluída via: ${source}`);
    console.log(`✅ ${adaptedData.questoes.length} questões adaptadas`);

    return NextResponse.json({
      adapted: adaptedData,
      source: source,
    });
  } catch (err) {
    console.error("❌ Erro na adaptação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao adaptar questões" },
      { status: 500 }
    );
  }
}
