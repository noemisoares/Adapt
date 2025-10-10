"use client";
import { useState } from "react";
import FileUploader from "../../../components/FileUploader/FileUploader";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const url = await uploadFile(selectedFile);
      setUploadedUrl(url);
    } catch (err) {
      console.error("Erro ao enviar:", err);
    }

    setUploading(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
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
            {!selectedFile ? (
              <FileUploader onFileSelect={setSelectedFile} />
            ) : (
              <div className={styles.fileInfo}>
                <p>{selectedFile.name}</p>
                <div className={styles.buttons}>
                  <button onClick={handleReset} className={styles.btnCancel}>
                    Trocar
                  </button>
                  <button
                    onClick={handleUpload}
                    className={styles.btnUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </div>
            )}
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
            <a
              href={uploadedUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnDownload}
            >
              Baixar Prova
            </a>
            <button onClick={handleReset} className={styles.btnCancel}>
              Enviar Outra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
