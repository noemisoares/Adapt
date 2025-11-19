"use client";

import { gerarPDFAdaptado } from "../downloadUtils";
import { useState } from "react";

export default function TestDownloadPage() {
  const [provaId, setProvaId] = useState("");
  const [adapted, setAdapted] = useState(null);

  const executarDownload = async () => {
    try {
      const { blob, safeName } = await gerarPDFAdaptado({
        provaId,
        adaptedData: adapted,
        selectedFile: { name: "teste.pdf" },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      a.click();
      URL.revokeObjectURL(url);

      alert("PDF baixado com sucesso!");
    } catch (err) {
      alert("Erro: " + err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Teste do Download</h1>

      <input
        type="text"
        placeholder="ID da Prova"
        value={provaId}
        onChange={(e) => setProvaId(e.target.value)}
      />

      <button
        onClick={() =>
          setAdapted({
            adaptedQuestions: [
              "Questão adaptada 1",
              "Questão adaptada 2",
              "Questão adaptada 3",
            ],
          })
        }
      >
        Simular Questões Adaptadas
      </button>

      <button onClick={executarDownload}>Testar Download</button>
    </div>
  );
}
