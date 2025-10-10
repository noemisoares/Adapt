"use client";
import { useRef } from "react";
import "./FileUploader.module.css";

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
      className="file-uploader"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="upload-content">
        <div className="upload-icon">⬆</div>
        <p className="upload-text">Arraste sua prova aqui</p>
        <p className="upload-subtext">
          ou clique no botão abaixo para selecionar
        </p>

        <button
          className="btn upload-btn"
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

        <p className="upload-info">
          Formatos suportados: PDF, Word, TXT, PNG, JPG (máx. 10 MB)
        </p>
      </div>
    </div>
  );
}
