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

/* ---------------------------- PARSER MARKDOWN ---------------------------- */

function parseMarkdownBlock(text = "") {
  if (!text.trim()) return [];

  const lines = text.split("\n");
  const result = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith("# ")) {
      result.push({
        text: line.substring(2).trim(),
        style: "mdH1",
        margin: [0, 6, 0, 6],
      });
      continue;
    }

    if (line.startsWith("## ")) {
      result.push({
        text: line.substring(3).trim(),
        style: "mdH2",
        margin: [0, 4, 0, 4],
      });
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      result.push({
        ul: [line.replace(/^[-*]\s*/, "").trim()],
        style: "mdList",
      });
      continue;
    }

    result.push({ text: parseBoldInline(line), margin: [0, 2] });
  }

  return result;
}

/* -------- PARSER PARA QUESTÕES (sem interpretação de # como header) -------- */

function parseQuestionBlock(text = "") {
  if (!text.trim()) return [];

  const lines = text.split("\n");
  const result = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Para questões, apenas interpretamos listas, não headers
    if (line.startsWith("- ") || line.startsWith("* ")) {
      result.push({
        ul: [line.replace(/^[-*]\s*/, "").trim()],
        style: "mdList",
      });
      continue;
    }

    // Texto normal com suporte a negrito
    result.push({ text: parseBoldInline(line), margin: [0, 2] });
  }

  return result;
}

/* ---------------------------- GERADOR PDF ---------------------------- */

export async function POST(req) {
  try {
    const pdfMakeModule = await import("pdfmake/build/pdfmake.min.js");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

    const pdfMake = pdfMakeModule.default;
    pdfMake.vfs = pdfFontsModule.default;

    const body = await req.json();

    const {
      adaptedQuestions = [],
      instrucoesOriginais = "",
      metadata = {},
    } = body;

    if (adaptedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão adaptada foi enviada." },
        { status: 400 }
      );
    }

    /* ------------------ CABEÇALHO DA PROVA ------------------ */

    const header = [
      {
        text: metadata.instituicao || "PROVA ADAPTADA",
        style: "headerInstitution",
        alignment: "center",
        margin: [0, 0, 0, 2],
      },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.2 },
          { type: "line", x1: 0, y1: 3, x2: 515, y2: 3, lineWidth: 0.8 },
        ],
        margin: [0, 4, 0, 14],
      },
      {
        columns: [
          { width: "*", text: `Disciplina: ${metadata.disciplina || "________"}`, style: "headerField" },
          { width: "*", text: `Professor(a): ${metadata.professor || "________"}`, style: "headerField" },
        ],
        columnGap: 10,
      },
      {
        columns: [
          { width: "*", text: `Curso/Série: ${metadata.curso || "________"}`, style: "headerField" },
          { width: "*", text: `Data: ${metadata.data || "___/___/____"}`, style: "headerField" },
        ],
        columnGap: 10,
      },
      {
        columns: [
          { width: "*", text: `Aluno(a): ________________________________`, style: "headerField" },
          { width: 100, text: `Nota: ______`, style: "headerField" },
        ],
        margin: [0, 6],
      },
      { text: "", margin: [0, 4] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
      { text: "", margin: [0, 10] },
    ];

    /* ------------------ INSTRUÇÕES ------------------ */
    const instructionsBlock = [
      { text: "INSTRUÇÕES DA PROVA:", style: "sectionTitle", margin: [0, 0, 0, 6] },
      instrucoesOriginais.trim() 
        ? { stack: parseMarkdownBlock(instrucoesOriginais), style: "instructionText" }
        : { text: "[Nenhuma instrução fornecida]", style: "instructionText", color: "#999" },
      { text: "", margin: [0, 10] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8 }] },
      { text: "", margin: [0, 14] },
    ];

    /* ------------------ QUESTÕES ADAPTADAS ------------------ */

    const corpo = adaptedQuestions.flatMap((texto, i) => {
      return [
        {
          text: `QUESTÃO ${i + 1}`,
          style: "questionTitle",
          margin: [0, 0, 0, 4],
        },
        {
          stack: parseMarkdownBlock(texto),
          style: "questionBody",
          margin: [0, 2, 0, 12],
        },
      ];
    });

    /* ------------------ RODAPÉ ------------------ */

    const rodape = (currentPage, pageCount) => ({
      margin: [0, 12],
      layout: "noBorders",
      table: {
        widths: ["*"],
        body: [[
          {
            text: `Página ${currentPage} de ${pageCount}  •  Gerado automaticamente`,
            style: "footerText",
            alignment: "center",
          },
        ]],
      },
    });

    /* ------------------ DEFINIÇÃO FINAL DO DOCUMENTO ------------------ */

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      footer: rodape,

      content: [...header, ...instructionsBlock, ...corpo],

      styles: {
        headerInstitution: { fontSize: 13, bold: true, color: "#002244" },
        headerField: { fontSize: 10 },
        sectionTitle: { fontSize: 11, bold: true, color: "#003366" },
        instructionText: { fontSize: 10, lineHeight: 1.4 },
        questionTitle: { fontSize: 11, bold: true, color: "#004488" },
        questionBody: { fontSize: 11, lineHeight: 1.55 },
        footerText: { fontSize: 9, color: "#666" },

        mdH1: { fontSize: 13, bold: true },
        mdH2: { fontSize: 12, bold: true },
        mdList: { fontSize: 11 },
      },
    };

    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    const pdfBuffer = await new Promise((resolve) =>
      pdfDocGenerator.getBuffer((buffer) => resolve(buffer))
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="prova_adaptada.pdf"',
      },
    });
  } catch (err) {
    console.error("❌ Erro ao gerar PDF:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
