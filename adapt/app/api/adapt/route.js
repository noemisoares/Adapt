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

    // 🔹 2. Extrai o texto do PDF (funcionando!)
    const data = await pdfParse(buffer);
    const originalText = data.text || "";

    // 🔹 3. Monta o prompt para o modelo da OpenAI
    const prompt = `
You are an assistant that adapts exam questions for students with ADHD.
Make the following transformations: 
- Keep the content and numeric parts intact.
- Increase clarity: shorten long sentences, use direct commands.
- Emphasize action verbs in uppercase or wrapped with **strong** markers.
- Break long questions into numbered bullets if needed.
- Output only JSON with field "adapted_text" containing the adapted exam text.

Original:
${originalText}

Options: ${JSON.stringify(options || {})}
`;

    // 🔹 4. Chama a OpenAI
    const llmResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
    });

    const adapted_text =
      llmResp.choices?.[0]?.message?.content?.trim?.() ||
      "Erro: resposta vazia";

    // 🔹 5. Gera novo PDF com o texto adaptado
    const doc = new PDFDocument({ margin: 40 });
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(writableStreamBuffer);

    doc
      .fontSize(18)
      .fillColor("#FF7A00")
      .text("Versão Adaptada", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).fillColor("#000").text(adapted_text, { align: "left" });
    doc.end();

    const pdfBuffer = writableStreamBuffer.getContents();

    // 🔹 6. Salva o arquivo adaptado no Back4App
    const safeName = `adapted_${Date.now()}.pdf`;
    const parseFile = new Parse.File(
      safeName,
      { base64: pdfBuffer.toString("base64") },
      "application/pdf"
    );
    const savedFile = await parseFile.save();

    // 🔹 7. Cria registro da prova adaptada
    const Prova = Parse.Object.extend("Provas");
    const prova = new Prova();
    prova.set("arquivoAdaptado", savedFile);
    prova.set("arquivoOriginalUrl", url);
    prova.set("usuario", Parse.User.current?.() || null);
    const savedProva = await prova.save();

    // 🔹 8. Retorna resposta JSON
    return NextResponse.json({
      adaptedUrl: savedFile.url(),
      provaId: savedProva.id,
      adaptedText: adapted_text,
    });
  } catch (err) {
    console.error("❌ Erro em /api/adapt:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 GET opcional para testar se a rota está ativa
export async function GET() {
  return NextResponse.json({ message: "Rota /api/adapt ativa e funcional" });
}
