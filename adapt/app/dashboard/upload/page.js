"use client";
import { useState } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);

    try {
      const url = await uploadFile(file);
      setUploadedUrl(url);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      alert("Erro ao enviar a prova.");
    }

    setUploading(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
  };

  const handleDownload = async () => {
    if (!uploadedUrl) {
      alert("Nenhum arquivo disponível para download.");
      return;
    }

    try {
      setDownloading(true);

      const response = await fetch(uploadedUrl);
      if (!response.ok) throw new Error("Falha ao buscar o arquivo.");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download =
        selectedFile?.name || "prova_adaptada." + blob.type.split("/")[1];
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      alert("Não foi possível baixar a prova.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!uploadedUrl ? (
        <>
          <h2 className={styles.title}>Criar Nova Prova Adaptada</h2>
          <p className={styles.subtitle}>
            Faça upload de uma prova e personalize as adaptações
          </p>

          <div className={styles.uploadArea}>
            <FileUploader onFileSelect={handleFileSelect} />
            {uploading && <p className={styles.loadingText}>Enviando...</p>}
          </div>
        </>
      ) : (
        <div className={styles.previewArea}>
          <h2 className={styles.title}>Prova Enviada!</h2>
          <p className={styles.subtitle}>Arquivo pronto para visualização:</p>

          <div className={styles.previewBox}>
            <iframe
              src={uploadedUrl}
              title="Preview da Prova"
              className={styles.previewFrame}
            />
          </div>

          <div className={styles.buttons}>
            <button
              onClick={handleDownload}
              className={styles.btnDownload}
              disabled={downloading}
            >
              {downloading ? "Baixando..." : "Baixar Prova Adaptada"}
            </button>

            <button onClick={handleReset} className={styles.btnCancel}>
              Enviar Outra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
