"use client";

import { useState, useCallback } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import ArquivoCarregado from "../../../components/ArquivoCarregado/ArquivoCarregado";
import OpcoesAdaptacao from "../../../components/OpcoesAdaptacao/OpcoesAdaptacao";
import VisualizacaoProva from "../../../components/VisualizacaoProva/VisualizacaoProva";
import { uploadFile } from "../../back4app/provas/uploadFile";
import Parse from "../../back4app/parseConfig";
import styles from "./page.module.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [provaId, setProvaId] = useState(null);

  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [settings, setSettings] = useState({
    fontSize: 14,
    lineHeight: 1.8,
    highlight: true,
    simplify: false,
    numbering: true,
    blocks: true,
  });

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);

    try {
      const url = await uploadFile(file);
      setUploadedUrl(url);

      const Prova = Parse.Object.extend("Provas");
      const prova = new Prova();
      prova.set("arquivoOriginal", new Parse.File(file.name, file));
      prova.set("usuario", Parse.User.current());
      const saved = await prova.save();
      setProvaId(saved.id);

      setParsedQuestions([]);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      alert("Erro ao enviar a prova.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
    setParsedQuestions([]);
    setProvaId(null);
  };

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

      if (provaId) {
        const Prova = Parse.Object.extend("Provas");
        const q = new Parse.Query(Prova);
        const provaObj = await q.get(provaId);
        provaObj.set("arquivoAdaptado", parseFile);
        provaObj.set("arquivoAdaptadoUrl", parseFile.url());
        await provaObj.save();
      } else {
        const Prova = Parse.Object.extend("Provas");
        const newP = new Prova();
        newP.set("arquivoAdaptado", parseFile);
        newP.set("usuario", Parse.User.current());
        const saved = await newP.save();
        setProvaId(saved.id);
      }

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

  const handleRequestGenerateAdapted = async () => {
    if (!uploadedUrl) return;

    try {
      setDownloading(true);

      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploadedUrl,
          options: settings, 
        }),
      });

      const data = await res.json();
      if (res.ok && data.adaptedUrl) {
        setParsedQuestions([
          {
            id: "adapted_1",
            text: data.adaptedText || "Texto adaptado não disponível",
          },
        ]);

        if (data.provaId) setProvaId(data.provaId);
      } else {
        alert(data.error || "Erro ao gerar adaptação da prova.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao se comunicar com a API de adaptação.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h2 className={styles.title}>Criar Nova Prova Adaptada</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          {!uploadedUrl ? (
            <div className={styles.uploadArea}>
              <FileUploader onFileSelect={handleFileSelect} />
              {uploading && <p className={styles.loadingText}>Enviando...</p>}
            </div>
          ) : (
            <>
              <ArquivoCarregado
                file={selectedFile}
                uploadedUrl={uploadedUrl}
                onReplace={handleReset}
                onRemove={handleReset}
              />
              <div style={{ height: 20 }} />
              <OpcoesAdaptacao settings={settings} onChange={setSettings} />
            </>
          )}
        </div>

        <div className={styles.right}>
          {uploadedUrl && (
            <>
              <div
                className={`${styles.visualizationCapture} ${styles.captureWrapper}`}
              >
                <VisualizacaoProva
                  originalUrl={uploadedUrl}
                  parsedQuestions={parsedQuestions}
                  settings={settings}
                  onRequestGenerateAdapted={handleRequestGenerateAdapted}
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
                  onClick={async () => {
                    if (!provaId) {
                      alert(
                        "Nenhuma prova registrada para salvar esboço. Reenvie arquivo."
                      );
                      return;
                    }
                    alert(
                      "Esboço já salvo no Back4App. A adaptação real é gerada no PDF."
                    );
                  }}
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
