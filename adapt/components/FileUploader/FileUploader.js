"use client";
import { useRef } from "react";
import styles from "./FileUploader.module.css";

export default function FileUploader({ onFileSelect }) {
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      className={styles.fileUploader}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className={styles.uploadContent}>
        <div className={styles.uploadIcon}>⬆</div>
        <p className={styles.uploadText}>Arraste sua prova aqui</p>
        <p className={styles.uploadSubtext}>
          ou clique no botão abaixo para selecionar
        </p>

        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current.click()}
        >
          Carregar Prova
        </button>

        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <p className={styles.uploadInfo}>
          Formatos suportados: PDF, Word, TXT, PNG, JPG (máx. 10 MB)
        </p>
      </div>
    </div>
  );
}