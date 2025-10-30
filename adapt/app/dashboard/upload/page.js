"use client";

import { useState, useCallback } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import ArquivoCarregado from "../../../components/ArquivoCarregado/ArquivoCarregado";
import OpcoesAdaptacao from "../../../components/OpcoesAdaptacao/OpcoesAdaptacao";
import VisualizacaoProva from "../../../components/VisualizacaoProva/VisualizacaoProva";
import Parse from "../../back4app/parseConfig";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [provaId, setProvaId] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [settings, setSettings] = useState({
    fontSize: 14,
    lineHeight: 1.8,
    highlight: true,
    simplify: false,
    numbering: true,
    blocks: true,
  });

  // Upload do arquivo original
  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);

    try {
      // Envia para API de parsing (PDF/DOCX/etc)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setOriginalQuestions(data.originalQuestions || []);
        setParsedQuestions(data.originalQuestions || []);

        // 🚀 Envia também para o Back4App
        const provaIdCriado = await uploadFile(file);
        setProvaId(provaIdCriado);
      } else {
        alert(data.error || "Erro ao processar arquivo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar arquivo para API.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedQuestions([]);
    setOriginalQuestions([]);
    setProvaId(null);
  };

  // 🧾 Geração e salvamento do PDF adaptado
  const handleGenerateAdaptedPdf = useCallback(async () => {
    const el = document.querySelector(`.${styles.visualizationCapture}`);
    if (!el) {
      alert("Não há visualização adaptada disponível para gerar PDF.");
      return;
    }

    try {
      setDownloading(true);

      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
      const pdfBlob = pdf.output("blob");

      const safeName =
        (selectedFile?.name || "prova_adaptada.pdf").replace(/\.[^/.]+$/, "") +
        "_adaptada.pdf";

      const parseFile = new Parse.File(safeName, pdfBlob);
      await parseFile.save();

      // 🔄 Atualiza a mesma prova no Back4App com o arquivo adaptado
      if (provaId) {
        const Prova = Parse.Object.extend("Provas");
        const q = new Parse.Query(Prova);
        const provaObj = await q.get(provaId);
        provaObj.set("arquivoAdaptado", parseFile);
        provaObj.set("arquivoAdaptadoUrl", parseFile.url());
        await provaObj.save();
        console.log("✅ Prova atualizada com arquivo adaptado:", provaId);
      }

      // 💾 Faz o download local do arquivo adaptado
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      alert("Prova adaptada gerada, salva e baixada com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar/adaptar PDF:", err);
      alert("Erro ao gerar prova adaptada.");
    } finally {
      setDownloading(false);
    }
  }, [provaId, selectedFile]);

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h2 className={styles.title}>Criar Nova Prova Adaptada</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          {!selectedFile ? (
            <div className={styles.uploadArea}>
              <FileUploader onFileSelect={handleFileSelect} />
              {uploading && (
                <p className={styles.loadingText}>Lendo arquivo...</p>
              )}
            </div>
          ) : (
            <>
              <ArquivoCarregado
                file={selectedFile}
                onReplace={handleReset}
                onRemove={handleReset}
              />
              <div style={{ height: 20 }} />
              <OpcoesAdaptacao settings={settings} onChange={setSettings} />
            </>
          )}
        </div>

        <div className={styles.right}>
          {selectedFile && (
            <>
              <div
                className={`${styles.visualizationCapture} ${styles.captureWrapper}`}
              >
                <VisualizacaoProva
                  parsedQuestions={parsedQuestions}
                  originalQuestions={originalQuestions}
                  settings={settings}
                  onRequestGenerateAdapted={() => {}}
                />
              </div>

              <div className={styles.actionsBottom}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGenerateAdaptedPdf}
                  disabled={downloading}
                >
                  {downloading ? "Gerando..." : "Baixar Prova Adaptada"}
                </button>

                <button
                  className={styles.btnSecondary}
                  onClick={handleGenerateAdaptedPdf}
                >
                  Salvar Esboço
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
