import Parse from "../parseConfig";

export async function uploadFile(file) {
  try {
    console.log("Iniciando upload:", file.name);

    const parseFile = new Parse.File(file.name, file);
    const savedFile = await parseFile.save();
    console.log("Arquivo salvo no Parse:", savedFile.url());

    const Prova = Parse.Object.extend("Provas");
    const prova = new Prova();
    prova.set("arquivoOriginal", savedFile);
    prova.set("usuario", Parse.User.current());

    const result = await prova.save();
    console.log("Prova salva com sucesso:", result);

    return savedFile.url();
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    alert("Erro: " + error.message);
    throw error;
  }
}
