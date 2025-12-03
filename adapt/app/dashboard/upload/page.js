"use client";

import { useState, useCallback } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import ArquivoCarregado from "../../../components/ArquivoCarregado/ArquivoCarregado";
import AdaptacaoProva from "../../../components/AdaptacaoProva/AdaptacaoProva";
import VisualizacaoProva from "../../../components/VisualizacaoProva/VisualizacaoProva";
import Parse from "../../back4app/parseConfig";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [provaId, setProvaId] = useState(null);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [adaptedData, setAdaptedData] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState(null);

  // === UPLOAD E PARSE DO ARQUIVO ===
  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    setError(null);
    setOriginalQuestions([]);
    setAdaptedData(null);

    try {
      const fileBuffer = await readFileAsArrayBuffer(file);
      const base64Content = arrayBufferToBase64(fileBuffer);
      setFileContent({
        name: file.name,
        type: file.type,
        content: base64Content,
      });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erro ao processar arquivo.");

      const data = await res.json();
      if (!data.originalQuestions?.length)
        throw new Error("Nenhuma questão detectada no arquivo.");

      setOriginalQuestions(data.originalQuestions);

      // Salva no Back4App
      const provaIdCriado = await uploadFile(file);
      setProvaId(provaIdCriado);
    } catch (err) {
      console.error("❌ Erro no upload:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const readFileAsArrayBuffer = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  // === GERA PDF ADAPTADO ===
  const handleGenerateAdaptedPdf = useCallback(async () => {
    if (!provaId || !adaptedData) {
      alert("Nenhuma adaptação gerada ainda. Aguarde o processamento.");
      return;
    }

    try {
      setDownloading(true);

      const Prova = Parse.Object.extend("Provas");
      const query = new Parse.Query(Prova);
      const provaObj = await query.get(provaId);
      const originalUrl = provaObj.get("arquivoOriginalUrl");

      if (!originalUrl) {
        alert("URL do arquivo original não encontrada. Refaça o upload.");
        return;
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
          instrucoesOriginais: adaptedData?.instrucoesOriginais || "",
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

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert("✅ Prova adaptada gerada e baixada com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar prova adaptada: " + err.message);
    } finally {
      setDownloading(false);
    }
  }, [provaId, adaptedData, selectedFile]);

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalQuestions([]);
    setAdaptedData(null);
    setProvaId(null);
    setFileContent(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Criar Nova Prova Adaptada</h2>

      {error && <div className={styles.error}>❌ {error}</div>}

      <div className={styles.grid}>
        <div className={styles.left}>
          {!selectedFile ? (
            <div className={styles.uploadArea}>
              <FileUploader onFileSelect={handleFileSelect} />
              {uploading && (
                <p className={styles.loadingText}>Processando arquivo...</p>
              )}
            </div>
          ) : (
            <ArquivoCarregado
              file={selectedFile}
              onReplace={handleReset}
              onRemove={handleReset}
            />
          )}
        </div>

        {/* Lado direito - Visualização e Adaptação */}
        <div className={styles.right}>
          {selectedFile && (
            <>
              <VisualizacaoProva
                parsedQuestions={originalQuestions}
                originalQuestions={originalQuestions}
              />

              <AdaptacaoProva
                provaId={provaId}
                fileContent={fileContent}
                originalQuestions={originalQuestions}
                onAdapted={setAdaptedData}
              />

              <div className={styles.actionsBottom}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGenerateAdaptedPdf}
                  disabled={downloading || !adaptedData}
                >
                  {downloading ? "Gerando PDF..." : "Baixar Prova Adaptada"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
