import Parse from "../parseConfig";

export async function getProvasUser({ limit = 50, order = "-createdAt" } = {}) {
  const user = Parse.User.current();
  if (!user) throw new Error("Usuário não autenticado.");

  const Prova = Parse.Object.extend("Provas");
  const query = new Parse.Query(Prova);
  query.equalTo("usuario", user);

  // query.exists("arquivoAdaptadoURL") //

  query.limit(limit);
  if (order === "-createdAt") query.descending("createdAt");

  //query.descending(order === "-createdAt" ? "createdAt" : undefined);

  const results = await query.find();

  return results.map(p => ({
    id: p.id,
    titulo: p.get("titulo") || null,
    criadoEm: p.createdAt,

    arquivoAdaptadoUrl: p.get("arquivoAdaptadoURL") || null, //

    //arquivoAdaptadoUrl: p.get("arquivoAdaptadoURL")?.url() || null, //
    //arquivoAdaptadoName: p.get("arquivoAdaptadoURL")?.name() || null, //
    adaptedText: p.get("adaptedText") || null,

    arquivoUrl: p.get("arquivoOriginal")?.url() || null,
    //arquivoName: p.get("arquivoOriginal")?.name() || null,
  }));
}
