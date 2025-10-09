"use client";
import { useState } from "react";
import FileUploader from "../../../components/FileUploader";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const url = await uploadFile(selectedFile);
    setUploadedUrl(url);
    setUploading(false);
  };

  return (
    <div className={styles["upload-container"]}>
      <h2 className={styles["upload-title"]}>Criar Nova Prova Adaptada</h2>

      {!selectedFile ? (
        <FileUploader onFileSelect={setSelectedFile} />
      ) : (
        <div className={styles["upload-actions"]}>
          <p>📄 {selectedFile.name}</p>
          <div className={styles["button-group"]}>
            <button
              onClick={() => setSelectedFile(null)}
              className={`${styles.btn} ${styles.danger}`}
            >
              Trocar
            </button>
            <button
              onClick={handleUpload}
              className={`${styles.btn} ${styles.primary}`}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {uploadedUrl && (
        <div className={styles["upload-success"]}>
          <p>Upload concluído!</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Ver no Back4App
          </a>
        </div>
      )}
    </div>
  );
}
