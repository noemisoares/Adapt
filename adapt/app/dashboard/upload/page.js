"use client";

import { useState } from "react";
import FileUploader from "../../../components/FileUploader";
import { uploadFile } from "../../back4app/provas/uploadFile";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    try {
      setUploading(true);
      const url = await uploadFile(selectedFile);
      setUploadedUrl(url);
      alert("Upload concluído com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Envie sua prova para adaptação</h2>

      <FileUploader onFileSelect={setSelectedFile} />

      {selectedFile && (
        <div className="file-info">
          <p>Arquivo selecionado: {selectedFile.name}</p>
          <button onClick={() => setSelectedFile(null)} className="btn danger">
            Trocar Arquivo
          </button>

          <button
            onClick={handleUpload}
            className="btn upload-confirm"
            disabled={uploading}
          >
            {uploading ? "Enviando..." : "Fazer Upload"}
          </button>
        </div>
      )}

      {uploadedUrl && (
        <div className="file-result">
          <p>Arquivo salvo no servidor:</p>
          <a
            href={uploadedUrl}
            target="_blank"
            className="text-blue-500 underline"
          >
            Visualizar no Back4App
          </a>
        </div>
      )}
    </div>
  );
}
