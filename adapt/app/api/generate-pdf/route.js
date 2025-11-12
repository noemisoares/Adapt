import { NextResponse } from "next/server";
import PdfPrinter from "pdfmake";
import fetch from "node-fetch";
import streamBuffers from "stream-buffers";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const { originalUrl, adaptedQuestions = [], metadata = {} } = body;

    if (!originalUrl || adaptedQuestions.length === 0) {
      return NextResponse.json(
        { error: "originalUrl e adaptedQuestions são obrigatórios" },
        { status: 400 }
      );
    }

    const res = await fetch(originalUrl);
    if (!res.ok) throw new Error("Falha ao baixar arquivo original.");
    await res.arrayBuffer(); 
    
    const cabecalho = [
      {
        text: "PROVA ADAPTADA PARA ESTUDANTES COM TDAH",
        style: "headerTitle",
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          {
            width: "50%",
            text: `Disciplina: ${
              metadata.disciplina || "____________________________"
            }`,
            style: "headerField",
          },
          {
            width: "50%",
            text: `Professor(a): ${
              metadata.professor || "____________________________"
            }`,
            style: "headerField",
          },
        ],
      },
      {
        columns: [
          {
            width: "50%",
            text: `Curso/Série: ${
              metadata.curso || "____________________________"
            }`,
            style: "headerField",
          },
          {
            width: "50%",
            text: `Data: ${metadata.data || "___/___/____"}`,
            style: "headerField",
          },
        ],
      },
      {
        columns: [
          {
            width: "50%",
            text: `Aluno(a): ____________________________`,
            style: "headerField",
          },
          {
            width: "50%",
            text: `Nota: _______`,
            style: "headerField",
          },
        ],
      },
      { text: "", margin: [0, 10] },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
      },
      { text: "", margin: [0, 10] },
    ];

    // 📘 Instruções universais
    const instrucoes = [
      { text: "INSTRUÇÕES:", style: "sectionTitle" },
      {
        ul: [
          "Leia cada questão com atenção.",
          "Responda todas as questões.",
          "Use caneta azul ou preta.",
          "Não é permitido consultar materiais.",
          "Não é permitido o uso de dispositivos eletrônicos.",
        ],
        style: "instructions",
        margin: [0, 5, 0, 15],
      },
    ];

    // 🧩 Corpo da prova adaptada
    const corpo = [];
    adaptedQuestions.forEach((questao, i) => {
      corpo.push({
        text: `Questão ${i + 1}`,
        style: "questionTitle",
      });
      corpo.push({
        text: questao,
        style: "questionBody",
        margin: [0, 4, 0, 12],
      });
    });

    // 📄 Rodapé neutro
    const rodape = (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount} — Documento gerado automaticamente`,
      alignment: "center",
      fontSize: 9,
      color: "#666",
      margin: [0, 10],
    });

    // 🖋️ Fontes básicas do pdfmake
    const fonts = {
      Roboto: {
        normal: path.resolve("./node_modules/pdfmake/fonts/Roboto-Regular.ttf"),
        bold: path.resolve("./node_modules/pdfmake/fonts/Roboto-Medium.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);

    // 🧾 Estrutura final do PDF
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      footer: rodape,
      content: [...cabecalho, ...instrucoes, ...corpo],
      styles: {
        headerTitle: {
          fontSize: 14,
          bold: true,
          color: "#003366",
          margin: [0, 0, 0, 4],
        },
        headerField: {
          fontSize: 10,
          margin: [0, 2],
        },
        sectionTitle: {
          fontSize: 11,
          bold: true,
          color: "#003366",
          margin: [0, 8, 0, 4],
        },
        instructions: {
          fontSize: 10,
          lineHeight: 1.4,
        },
        questionTitle: {
          fontSize: 11,
          bold: true,
          color: "#004488",
          margin: [0, 6, 0, 2],
        },
        questionBody: {
          fontSize: 11,
          lineHeight: 1.6,
        },
      },
    };

    // 🧰 Criação e envio do PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writable = new streamBuffers.WritableStreamBuffer();
    pdfDoc.pipe(writable);
    pdfDoc.end();

    await new Promise((resolve) => writable.on("finish", resolve));
    const pdfBuffer = writable.getContents();

    const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new Uint8Array(pdfBuffer));
    controller.close();
  },
});

return new NextResponse(stream, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="prova_adaptada_tdahtemplate.pdf"',
  },
});
  } catch (err) {
    console.error("❌ Erro em /api/generate-pdf:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao gerar PDF." },
      { status: 500 }
    );
  }
}
