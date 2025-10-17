"use client";

import React from "react";
import styles from "./ArquivoCarregado.module.css";

export default function ArquivoCarregado({
  file,
  onReplace,
  onRemove,
  uploadedUrl,
}) {
  if (!file && !uploadedUrl) {
    return null;
  }

  const name = file?.name || (uploadedUrl && uploadedUrl.split("/").pop());
  const size = file ? `${(file.size / 1024).toFixed(2)} KB` : "";

  return (
    <div className={styles.container}>
      <h3>Arquivo Carregado</h3>

      <div className={styles.box}>
        <div className={styles.icon}>📄</div>
        <div className={styles.meta}>
          <div className={styles.name}>{name}</div>
          {size && <div className={styles.size}>{size}</div>}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnReplace} onClick={onReplace}>
          Trocar Arquivo
        </button>
        {onRemove && (
          <button className={styles.btnRemove} onClick={onRemove}>
            Remover
          </button>
        )}
      </div>
    </div>
  );
}