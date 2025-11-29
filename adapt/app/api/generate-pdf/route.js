import { NextResponse } from "next/server";

function parseBoldInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part };
  });
}

function parseMarkdownBlock(text = "") {
  const lines = text.split("\n").filter(Boolean);
  const result = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      result.push({
        text: line.replace(/^#\s+/, "").trim(),
        style: "mdH1",
        margin: [0, 6, 0, 6],
      });
      continue;
    }

    if (line.startsWith("## ")) {
      result.push({
        text: line.replace(/^##\s+/, "").trim(),
        style: "mdH2",
        margin: [0, 4, 0, 4],
      });
      continue;
    }

    const inlineParts = parseBoldInline(line);
    result.push({ text: inlineParts });
  }

  return result;
}


export async function POST(req) {
  try {
    // Import dinâmico do pdfMake (com fontes internas)
    const pdfMakeModule = await import("pdfmake/build/pdfmake.min.js");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

    const pdfMake = pdfMakeModule.default;
    pdfMake.vfs = pdfFontsModule.default; // embute as fontes internas

    // 🔹 Pega o corpo da requisição
    const body = await req.json();
    const { adaptedQuestions = [], metadata = {} } = body;

    if (adaptedQuestions.length === 0) {
      return NextResponse.json(
        { error: "adaptedQuestions são obrigatórios" },
        { status: 400 }
      );
    }

    const cabecalho = [
      {
        text: "PROVA ADAPTADA PARA ESTUDANTES COM TDAH",
        style: "headerTitle",
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          { width: "50%", text: `Disciplina: ${metadata.disciplina || "_________"}`, style: "headerField" },
          { width: "50%", text: `Professor(a): ${metadata.professor || "_________"}`, style: "headerField" },
        ],
      },
      {
        columns: [
          { width: "50%", text: `Curso/Série: ${metadata.curso || "_________"}`, style: "headerField" },
          { width: "50%", text: `Data: ${metadata.data || "___/___/____"}`, style: "headerField" },
        ],
      },
      {
        columns: [
          { width: "50%", text: `Aluno(a): ____________________________`, style: "headerField" },
          { width: "50%", text: `Nota: _______`, style: "headerField" },
        ],
      },
      { text: "", margin: [0, 10] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
      { text: "", margin: [0, 10] },
    ];

    // 📘 Instruções
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

    // 🧩 Corpo da prova
    // Mantive o bloco "Questão X" como você tinha. A única diferença:
    // o conteúdo da questão (questao) agora é transformado por parseMarkdownBlock,
    // e passado para o pdfMake como `stack` (sequência de blocos).
    const corpo = adaptedQuestions.flatMap((questao, i) => [
      { text: `Questão ${i + 1}`, style: "questionTitle" },
      { stack: parseMarkdownBlock(questao), style: "questionBody", margin: [0, 4, 0, 12] },
    ]);

    // 📄 Rodapé
    const rodape = (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount} — Documento gerado automaticamente`,
      alignment: "center",
      fontSize: 9,
      color: "#666",
      margin: [0, 10],
    });

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      footer: rodape,
      content: [...cabecalho, ...instrucoes, ...corpo],
      styles: {
        headerTitle: { fontSize: 14, bold: true, color: "#003366" },
        headerField: { fontSize: 10 },
        sectionTitle: { fontSize: 11, bold: true, color: "#003366" },
        instructions: { fontSize: 10, lineHeight: 1.4 },
        questionTitle: { fontSize: 11, bold: true, color: "#004488" },
        questionBody: { fontSize: 11, lineHeight: 1.6 },
        mdH1: { fontSize: 13, bold: true, color: "#002244" },
        mdH2: { fontSize: 12, bold: true, color: "#003355" },
      },
    };

    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    const pdfBuffer = await new Promise((resolve) =>
      pdfDocGenerator.getBuffer((buffer) => resolve(buffer))
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="prova_adaptada.pdf"',
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
