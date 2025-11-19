import Parse from "../../back4app/parseConfig";

export async function gerarPDFAdaptado({
  provaId,
  adaptedData,
  selectedFile,
}) {
  if (!provaId || !adaptedData) {
    throw new Error("Nenhuma adaptação gerada ainda.");
  }

  const Prova = Parse.Object.extend("Provas");
  const query = new Parse.Query(Prova);
  const provaObj = await query.get(provaId);
  const originalUrl = provaObj.get("arquivoOriginalUrl");

  if (!originalUrl) {
    throw new Error("URL do arquivo original não encontrada.");
  }

  const adaptedQuestionsArray = adaptedData?.adaptedQuestions?.length
    ? adaptedData.adaptedQuestions
    : adaptedData?.questoes?.map((q) => q.adaptada) || [];

  if (!adaptedQuestionsArray.length) {
    throw new Error("Nenhuma questão adaptada encontrada para o PDF.");
  }

  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalUrl,
      adaptedQuestions: adaptedQuestionsArray,
    }),
  });

  if (!res.ok) throw new Error("Erro ao gerar PDF.");

  const blob = await res.blob();
  const safeName =
    (selectedFile?.name || "prova_adaptada.pdf").replace(/\.[^/.]+$/, "") +
    "_adaptada.pdf";

  const parseFile = new Parse.File(safeName, blob);
  await parseFile.save();

  provaObj.set("arquivoAdaptado", parseFile);
  provaObj.set("arquivoAdaptadoUrl", parseFile.url());
  await provaObj.save();

  return { blob, safeName };
}
