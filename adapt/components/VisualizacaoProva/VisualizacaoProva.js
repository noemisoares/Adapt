"use client";

import React, { useState } from "react";
import styles from "./VisualizacaoProva.module.css";

export default function VisualizacaoProva({
  parsedQuestions,
  originalQuestions,
  settings,
  onRequestGenerateAdapted,
}) {
  const [mode, setMode] = useState("adapted");

  const renderQuestion = (q, i) => {
    let adaptedText = q.text;

    // 1. Destacar palavras-chave
    if (settings.highlight) {
      adaptedText = adaptedText.replace(
        /\b(importante|atenção|resolva|calcule|explique|defina|identifique|analise)\b/gi,
        '<mark style="background: #fff176; padding: 0 3px; border-radius: 3px;">$1</mark>'
      );
    }

    // 2. Simplificar instruções
    if (settings.simplify) {
      adaptedText = adaptedText
        .replace(/leia atentamente o texto a seguir[:,]?/gi, "")
        .replace(
          /(responda|explique|descreva)\s+com suas palavras/gi,
          "$1 de forma simples"
        )
        .replace(/\s{2,}/g, " ");
    }

    // 3. Quebrar em blocos
    if (settings.blocks) {
      adaptedText = adaptedText.replace(/(\.|\?|\!)(\s+)/g, "$1<br><br>");
    }

    // 4. Numeração destacada
    const number = settings.numbering ? `<strong>${i + 1}.</strong> ` : "";

    return (
      <div key={q.id || i} className={styles.question}>
        <div
          className={styles.qbody}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: number + adaptedText }}
        />
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
