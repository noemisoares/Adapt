"use client";

import React from "react";
import styles from "./OpcoesAdaptacao.module.css";

export default function OpcoesAdaptacao({ settings, onChange }) {
  const handle = (key, value) => onChange?.({ ...settings, [key]: value });

  return (
    <aside className={styles.container}>
      <h3>Opções de Adaptação</h3>

      <div className={styles.control}>
        <label>
          Tamanho da Fonte: <strong>{settings.fontSize}pt</strong>
        </label>
        <input
          type="range"
          min="12"
          max="28"
          value={settings.fontSize}
          onChange={(e) => handle("fontSize", Number(e.target.value))}
        />
      </div>

      <div className={styles.control}>
        <label>
          Espaçamento entre Linhas: <strong>{settings.lineHeight}</strong>
        </label>
        <input
          type="range"
          min="1"
          max="2.5"
          step="0.1"
          value={settings.lineHeight}
          onChange={(e) => handle("lineHeight", Number(e.target.value))}
        />
      </div>

      <hr />

      <div className={styles.toggle}>
        <label>Destacar Palavras-chave</label>
        <input
          type="checkbox"
          checked={settings.highlight}
          onChange={(e) => handle("highlight", e.target.checked)}
        />
      </div>

      <div className={styles.toggle}>
        <label>Simplificar Instruções</label>
        <input
          type="checkbox"
          checked={settings.simplify}
          onChange={(e) => handle("simplify", e.target.checked)}
        />
      </div>

      <div className={styles.toggle}>
        <label>Numeração Destacada</label>
        <input
          type="checkbox"
          checked={settings.numbering}
          onChange={(e) => handle("numbering", e.target.checked)}
        />
      </div>

      <div className={styles.toggle}>
        <label>Quebrar em Blocos</label>
        <input
          type="checkbox"
          checked={settings.blocks}
          onChange={(e) => handle("blocks", e.target.checked)}
        />
      </div>
    </aside>
  );
}
