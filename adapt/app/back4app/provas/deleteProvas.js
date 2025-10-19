import Parse from "../parseConfig";
export async function deleteProva(id) {
  const Prova = Parse.Object.extend("Provas");
  const query = new Parse.Query(Prova);

  const prova = await query.get(id);
  if (!prova) throw new Error("Prova não encontrada.");

  await prova.destroy();
  return true;
}