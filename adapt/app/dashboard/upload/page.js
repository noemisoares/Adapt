"use client";
import { useState } from "react";
import Parse from "../../back4app/parseConfig";
import FileUploader from "../../../components/FileUploader/FileUploader";
import { uploadFile } from "../../back4app/provas/uploadFile";
import styles from "./page.module.css";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);

    try {
      const url = await uploadFile(file);
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

  const handleSaveToBack4App = async () => {
    if (!uploadedUrl) return;

    try {
      const Prova = Parse.Object.extend("Provas");
      const prova = new Prova();

      prova.set("arquivoUrl", uploadedUrl);
      prova.set("usuario", Parse.User.current());

      await prova.save();
      alert("Prova salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar no Back4App:", error);
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
              onClick={handleSaveToBack4App}
              className={styles.btnDownload}
            >
              Baixar Prova Adaptada
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
