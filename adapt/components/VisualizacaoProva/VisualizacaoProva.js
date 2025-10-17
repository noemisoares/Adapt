"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./VisualizacaoProva.module.css";

export default function VisualizacaoProva({
  originalUrl,
  parsedQuestions,
  settings,
  onRequestGenerateAdapted,
}) {
  const [mode, setMode] = useState("adapted");
  const containerRef = useRef();

  useEffect(() => {
  }, [settings]);

  const renderQuestion = (q, i) => {
    const number = settings.numbering ? `${i + 1}` : "";
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

      <div className={styles.preview} ref={containerRef}>
        {mode === "original" ? (
          originalUrl ? (
            <iframe
              src={originalUrl}
              title="Original"
              className={styles.iframe}
            />
          ) : (
            <div className={styles.placeholder}>
              Sem visualização original disponível.
            </div>
          )
        ) : (
          <div className={styles.adapted}>
            {!parsedQuestions || parsedQuestions.length === 0 ? (
              <div className={styles.placeholder}>
                Sem conteúdo adaptado ainda. Clique em "Re-gerar Adaptado" para
                tentar adaptar.
              </div>
            ) : (
              parsedQuestions.map(renderQuestion)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
