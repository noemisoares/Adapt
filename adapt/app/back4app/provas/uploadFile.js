import Parse from "../parseConfig";

export async function uploadFile(file) {
  try {
    console.log("Iniciando upload:", file.name);

    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");

    console.log("Nome sanitizado:", safeFileName);

    const parseFile = new Parse.File(safeFileName, file);
    const savedFile = await parseFile.save();

    console.log("Arquivo salvo no Parse:", savedFile.url());

    const Prova = Parse.Object.extend("Provas");
    const prova = new Prova();

    prova.set("titulo", safeFileName);
    prova.set("arquivoOriginal", savedFile);
    prova.set("arquivoOriginalUrl", savedFile.url());
    prova.set("usuario", Parse.User.current());

    const result = await prova.save();

    console.log("Prova criada com arquivo original:", result.id);
    return result.id; // devolve o ID da prova criada
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    alert("Erro: " + error.message);
    throw error;
  }
}
