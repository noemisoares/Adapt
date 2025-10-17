import { NextResponse } from "next/server";
import fetch from "node-fetch";
import * as pdfParse from "pdf-parse";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";
import Parse from "../../back4app/parseConfig";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { url, options } = await req.json();
    if (!url)
      return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao baixar o PDF original");
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse.default(buffer);
    const originalText = data.text || "";

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

    const llmResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
    });

    const adapted_text = llmResp.choices?.[0]?.message?.content?.trim?.() || "";

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

    const safeName = `adapted_${Date.now()}.pdf`;
    const parseFile = new Parse.File(
      safeName,
      { base64: pdfBuffer.toString("base64") },
      "application/pdf"
    );
    const savedFile = await parseFile.save();

    const Prova = Parse.Object.extend("Provas");
    const prova = new Prova();
    prova.set("arquivoAdaptado", savedFile);
    prova.set("arquivoOriginalUrl", url);
    prova.set("usuario", Parse.User.current() || null);
    const savedProva = await prova.save();

    return NextResponse.json({
      adaptedUrl: savedFile.url(),
      provaId: savedProva.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
