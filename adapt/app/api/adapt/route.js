import { NextResponse } from "next/server";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";
import { createRequire } from "module";

// ✅ Importa pdf-parse corretamente no ambiente ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ✅ Importa Parse apenas no servidor
let Parse;
if (typeof window === "undefined") {
  const mod = await import("../../back4app/parseConfig.js");
  Parse = mod.default || mod;
}

// ✅ Cliente OpenAI (usa variável do .env.local)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { url, options } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // 🔹 1. Baixa o PDF original
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao baixar o PDF original");

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔹 2. Extrai o texto do PDF
    const data = await pdfParse(buffer);
    const originalText = data.text || "";

    // 🔹 3. Detecta título e separa questões
    const lines = originalText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const titulo = lines[0] || "Prova sem título";
    const corpo = lines.slice(1).join("\n");

    // Divide pelas numerações mais comuns
    const questoes = corpo
      .split(/(?=\b(?:\d+\.)|(?:Quest[aã]o\s*\d+)|(?:Q\d+\))|(?:\d+\s*-))/gi)
      .map((q) => q.trim())
      .filter((q) => q.length > 3);

    console.log("📘 Título detectado:", titulo);
    console.log("📋 Questões detectadas:", questoes.length);

    const structuredInput = { titulo, questoes };

    // 🔹 4. Prompt da IA
    const prompt = `
You are an assistant that adapts exam questions for students with ADHD.
Keep all numeric parts intact.
Simplify instructions and emphasize key terms.
Output must be JSON:
{
  "titulo": "...",
  "questoes": ["Questão 1 adaptada...", "Questão 2 adaptada...", ...]
}

Original exam data:
${JSON.stringify(structuredInput, null, 2)}

Options: ${JSON.stringify(options || {})}
`;

    // 🔹 5. Chama a OpenAI
    const llmResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    const adapted_json = llmResp.choices?.[0]?.message?.content?.trim?.();
    const adapted = JSON.parse(adapted_json || "{}");

    // 🔹 6. Gera PDF da versão adaptada
    const doc = new PDFDocument({ margin: 40 });
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(writableStreamBuffer);

    doc
      .fontSize(18)
      .fillColor("#FF7A00")
      .text(adapted.titulo, { align: "center" });
    doc.moveDown();

    adapted.questoes?.forEach((q, i) => {
      doc
        .fontSize(13)
        .fillColor("#000")
        .text(`${i + 1}. ${q}`, { align: "left" })
        .moveDown();
    });

    doc.end();
    const pdfBuffer = writableStreamBuffer.getContents();

    // 🔹 7. Salva no Back4App
    const safeName = `adapted_${Date.now()}.pdf`;
    const parseFile = new Parse.File(
      safeName,
      { base64: pdfBuffer.toString("base64") },
      "application/pdf"
    );
    const savedFile = await parseFile.save();

    // 🔹 8. Cria registro da prova adaptada
    const Prova = Parse.Object.extend("Provas");
    const prova = new Prova();
    prova.set("arquivoAdaptado", savedFile);
    prova.set("arquivoOriginalUrl", url);
    prova.set("usuario", Parse.User.current?.() || null);
    const savedProva = await prova.save();

    // 🔹 9. Retorna JSON completo para o front
    return NextResponse.json({
      adaptedUrl: savedFile.url(),
      provaId: savedProva.id,
      adapted,
    });
  } catch (err) {
    console.error("❌ Erro em /api/adapt:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 GET opcional
export async function GET() {
  return NextResponse.json({ message: "Rota /api/adapt ativa e funcional" });
}
