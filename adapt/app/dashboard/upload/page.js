"use client";

import { useState, useCallback } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import ArquivoCarregado from "../../../components/ArquivoCarregado/ArquivoCarregado";
import VisualizacaoProva from "../../../components/VisualizacaoProva/VisualizacaoProva";
import Parse from "../../back4app/parseConfig";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [provaId, setProvaId] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [adaptedData, setAdaptedData] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState(null);

  // Upload e processamento completo do arquivo
  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    setError(null);
    setParsedQuestions([]);
    setOriginalQuestions([]);
    setAdaptedData(null);

    try {
      // 1. Lê o conteúdo do arquivo para base64
      const fileBuffer = await readFileAsArrayBuffer(file);
      const base64Content = arrayBufferToBase64(fileBuffer);

      setFileContent({
        name: file.name,
        type: file.type,
        content: base64Content,
      });

      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Enviando arquivo para parse...");

      // 2. Processa arquivo para extrair questões
      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      let errorData;
      if (!res.ok) {
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: `Erro ${res.status} ao processar arquivo` };
        }
        throw new Error(errorData.error || "Erro ao processar arquivo");
      }

      const data = await res.json();
      console.log("📋 Resposta do parse-file:", data);

      if (!data.originalQuestions || data.originalQuestions.length === 0) {
        throw new Error(
          "Nenhuma questão detectada no arquivo. Verifique o formato."
        );
      }

      setOriginalQuestions(data.originalQuestions || []);
      setParsedQuestions(data.originalQuestions || []);

      // 3. Salva no Back4App e obtém URL real
      console.log("💾 Salvando no Back4App...");
      const provaIdCriado = await uploadFile(file);
      setProvaId(provaIdCriado);
      console.log("✅ Prova salva com ID:", provaIdCriado);

      // Aguarda um pouco para o Back4App processar e então busca a URL
      setTimeout(async () => {
        try {
          const Prova = Parse.Object.extend("Provas");
          const query = new Parse.Query(Prova);
          const provaObj = await query.get(provaIdCriado);
          const originalUrl = provaObj.get("arquivoOriginalUrl");

          if (originalUrl) {
            console.log("🔗 URL obtida:", originalUrl);
            // 4. Gera adaptação com a URL real
            await fetchAdapted(originalUrl);
          } else {
            console.error("URL não disponível ainda, usando fallback...");
            // Fallback: usa o conteúdo base64 diretamente
            await fetchAdaptedWithContent(base64Content, file.name);
          }
        } catch (error) {
          console.error("Erro ao buscar URL:", error);
          // Fallback: usa o conteúdo base64 diretamente
          await fetchAdaptedWithContent(base64Content, file.name);
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Erro no processamento:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Função para ler arquivo como ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Gera versão adaptada com URL real
  const fetchAdapted = useCallback(async (url) => {
    if (!url) return;

    try {
      console.log("🔄 Iniciando adaptação com IA...");
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro na adaptação");
      }

      const data = await res.json();
      if (res.ok && data.adapted) {
        setAdaptedData(data.adapted);

        // Mapeia apenas as questões adaptadas para exibição
        const parsed = data.adapted.questoes.map((q, i) => ({
          id: `q${i + 1}`,
          text: q.adaptada,
        }));

        setParsedQuestions(parsed);
        console.log("✅ Adaptação realizada com sucesso!", parsed);
      } else {
        throw new Error("Resposta de adaptação inválida");
      }
    } catch (err) {
      console.error("❌ Erro ao enviar adaptação:", err);
      setError("Erro na adaptação: " + err.message);
    }
  }, []);

  // Fallback: gera adaptação com conteúdo base64
  const fetchAdaptedWithContent = async (base64Content, fileName) => {
    try {
      console.log("🔄 Iniciando adaptação com base64...");
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Content: base64Content,
          fileName: fileName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro na adaptação com base64");
      }

      const data = await res.json();
      if (data.adapted) {
        setAdaptedData(data.adapted);

        const parsed = data.adapted.questoes.map((q, i) => ({
          id: `q${i + 1}`,
          text: q.adaptada,
        }));

        setParsedQuestions(parsed);
        console.log("✅ Adaptação realizada com conteúdo base64!", parsed);
      } else {
        throw new Error("Resposta de adaptação inválida");
      }
    } catch (err) {
      console.error("❌ Erro na adaptação com base64:", err);
      setError("Erro na adaptação: " + err.message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedQuestions([]);
    setOriginalQuestions([]);
    setProvaId(null);
    setAdaptedData(null);
    setFileContent(null);
    setError(null);
  };

  // Gera PDF final com questões adaptadas
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
        alert(
          "URL do arquivo original não encontrada. Tente refazer o upload."
        );
        return;
      }

      console.log("📄 Gerando PDF adaptado...");
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl,
          adaptedQuestions: adaptedData.questoes.map((q) => q.adaptada),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro na geração do PDF:", errorText);
        throw new Error("Erro ao gerar PDF: " + errorText);
      }

      const blob = await res.blob();
      const safeName =
        (selectedFile?.name || "prova_adaptada.pdf").replace(/\.[^/.]+$/, "") +
        "_adaptada.pdf";

      // Salva no Back4App
      const parseFile = new Parse.File(safeName, blob);
      await parseFile.save();

      provaObj.set("arquivoAdaptado", parseFile);
      provaObj.set("arquivoAdaptadoUrl", parseFile.url());
      await provaObj.save();

      // Download automático
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert("Prova adaptada gerada, salva e baixada com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar/adaptar PDF:", err);
      alert("Erro ao gerar prova adaptada: " + err.message);
    } finally {
      setDownloading(false);
    }
  }, [provaId, adaptedData, selectedFile]);

  // Função para regenerar adaptação
  const handleRegenerateAdaptation = async () => {
    if (!provaId) {
      alert("Nenhuma prova carregada ainda.");
      return;
    }

    try {
      const Prova = Parse.Object.extend("Provas");
      const query = new Parse.Query(Prova);
      const provaObj = await query.get(provaId);
      const originalUrl = provaObj.get("arquivoOriginalUrl");

      if (originalUrl) {
        await fetchAdapted(originalUrl);
      } else if (fileContent) {
        await fetchAdaptedWithContent(fileContent.content, fileContent.name);
      } else {
        alert("Não foi possível regenerar a adaptação. Faça upload novamente.");
      }
    } catch (error) {
      console.error("Erro ao regenerar:", error);
      alert("Erro ao regenerar adaptação");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h2 className={styles.title}>Criar Nova Prova Adaptada</h2>
        {error && (
          <div
            className={styles.error}
            style={{
              color: "red",
              marginTop: "10px",
              padding: "10px",
              background: "#ffe6e6",
              borderRadius: "5px",
              border: "1px solid #ffcccc",
            }}
          >
            ❌ {error}
          </div>
        )}
      </div>

      <div className={styles.grid}>
        {/* Lado esquerdo - Upload */}
        <div className={styles.left}>
          {!selectedFile ? (
            <div className={styles.uploadArea}>
              <FileUploader onFileSelect={handleFileSelect} />
              {uploading && (
                <p className={styles.loadingText}>
                  Processando e adaptando arquivo...
                </p>
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

        {/* Lado direito - Visualização e Ações */}
        <div className={styles.right}>
          {selectedFile && (
            <>
              <div className={styles.visualizationCapture}>
                <VisualizacaoProva
                  parsedQuestions={parsedQuestions}
                  originalQuestions={originalQuestions}
                  onRequestGenerateAdapted={handleRegenerateAdaptation}
                />
              </div>

              <div className={styles.actionsBottom}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGenerateAdaptedPdf}
                  disabled={downloading || !adaptedData}
                >
                  {downloading ? "Gerando PDF..." : "Baixar Prova Adaptada"}
                </button>
                {!adaptedData && !uploading && (
                  <p
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginTop: "10px",
                    }}
                  >
                    Processando adaptação...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
