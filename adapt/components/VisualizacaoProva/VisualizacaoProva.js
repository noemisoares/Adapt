"use client";

import React, { useState } from "react";
import styles from "./VisualizacaoProva.module.css";

export default function VisualizacaoProva({
  parsedQuestions,
  originalQuestions,
  onRequestGenerateAdapted,
}) {
  const [mode, setMode] = useState("adapted");

  const questionsToRender =
    mode === "adapted" ? parsedQuestions : originalQuestions;

  const renderQuestion = (q, i) => {
    const text = q.text || q;

    const htmlText = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="color: #1a73e8; font-weight: bold;">$1</strong>'
    );

    return (
      <div key={q.id || i} className={styles.questionBlock}>
        <div
          className={styles.qbody}
          style={{
            fontSize: "16px",
            lineHeight: 1.8,
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          dangerouslySetInnerHTML={{ __html: htmlText }}
        />
      </div>
    );
  };

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

        <button className={styles.btnSmall} onClick={onRequestGenerateAdapted}>
          Regenerar Adaptação
        </button>
      </div>

      <div className={styles.preview}>
        {!questionsToRender || questionsToRender.length === 0 ? (
          <div className={styles.placeholder}>
            {mode === "adapted"
              ? "Carregando questões adaptadas..."
              : "Carregando questões originais..."}
          </div>
        ) : (
          <div className={styles.questionsList}>
            {questionsToRender.map(renderQuestion)}
          </div>
        )}
      </div>
    </div>
  );
}
