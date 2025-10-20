"use client";

import React, { useState } from "react";
import styles from "./VisualizacaoProva.module.css";

export default function VisualizacaoProva({
  parsedQuestions,
  originalQuestions,
  settings,
  onRequestGenerateAdapted,
}) {
  const [mode, setMode] = useState("adapted"); // "adapted" ou "original"

  const renderQuestion = (q, i) => {
    const number = settings.numbering ? `${i + 1}. ` : "";
    return (
      <div key={q.id || i} className={styles.question}>
        <div className={styles.qnum}>{number}</div>
        <div className={styles.qbody}>
          <div
            className={styles.qtext}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
            dangerouslySetInnerHTML={{ __html: q.text }}
          />
        </div>
      </div>
    );
  };

  const questionsToRender =
    mode === "adapted" ? parsedQuestions : originalQuestions;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.modeSwitch}>
          <button
            className={mode === "adapted" ? styles.active : ""}
            onClick={() => setMode("adapted")}
          >
            Versão Adaptada
          </button>
          <button
            className={mode === "original" ? styles.active : ""}
            onClick={() => setMode("original")}
          >
            Original
          </button>
        </div>

        <div>
          <button
            className={styles.btnSmall}
            onClick={onRequestGenerateAdapted}
          >
            Re-gerar Adaptado
          </button>
        </div>
      </div>

      <div className={styles.preview}>
        {!questionsToRender || questionsToRender.length === 0 ? (
          <div className={styles.placeholder}>
            Sem conteúdo {mode === "adapted" ? "adaptado" : "original"} ainda.
          </div>
        ) : (
          questionsToRender.map(renderQuestion)
        )}
      </div>
    </div>
  );
}
