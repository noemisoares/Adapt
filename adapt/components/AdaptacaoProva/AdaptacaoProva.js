"use client";
import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./AdaptacaoProva.module.css";

export default function AdaptacaoProva({
  provaId,
  fileContent,
  originalQuestions = [],
  onAdapted,
}) {
  const [loading, setLoading] = useState(false);
  const [adaptedData, setAdaptedData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdapted = useCallback(
    async (urlOrBase64) => {
      try {
        setLoading(true);
        setError(null);

        const isUrl =
          typeof urlOrBase64 === "string" && urlOrBase64.startsWith("http");

        const res = await fetch("/api/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isUrl ? { url: urlOrBase64 } : { base64Content: urlOrBase64 }
          ),
        });

        if (!res.ok) throw new Error("Erro ao adaptar prova.");

        const data = await res.json();
        console.log("🔍 Retorno da API /api/adapt:", data);

        const adaptedResp = data?.adapted || data;

        const adaptedArr =
          adaptedResp?.adaptedQuestions ||
          (adaptedResp?.adaptedText
            ? adaptedResp.adaptedText
                .split(/\n{1,2}(?=\d+\s*[\.\)])/) // tenta quebrar por novas linhas antes de número
                .map((s) => s.trim())
                .filter(Boolean)
            : null) ||
          null;

        if (!adaptedArr || !Array.isArray(adaptedArr) || adaptedArr.length === 0) {
          throw new Error("Nenhum enunciado adaptado retornado pela IA.");
        }

        // 🔹 Detecta se o primeiro bloco é cabeçalho (não começa com número)
        let cabecalho = null;
        if (adaptedArr.length > 0 && !/^\s*\d+[\.\)]/.test(adaptedArr[0])) {
          cabecalho = adaptedArr[0];
        }

        // 🔹 Filtra apenas os blocos que parecem questões (começam com número)
        const adaptedQuestionsOnly = adaptedArr.filter((bloco) =>
          /^\d+[\.\)]/.test(bloco.trim())
        );

        const questoes = adaptedQuestionsOnly.map((adaptada, i) => {
          const originalObj = originalQuestions?.[i];
          const originalText =
            originalObj?.text || originalObj?.id || `Questão ${i + 1}`;
          return {
            original: originalText,
            adaptada:
              typeof adaptada === "string"
                ? adaptada
                : JSON.stringify(adaptada, null, 2),
          };
        });

        const adapted = {
          cabecalho,
          adaptedQuestions: adaptedArr,
          questoes,
        };

        setAdaptedData(adapted);
        onAdapted?.(adapted);
      } catch (err) {
        console.error("❌ Erro ao adaptar:", err);
        setError(err.message || "Erro ao adaptar a prova.");
      } finally {
        setLoading(false);
      }
    },
    [onAdapted, originalQuestions]
  );

  useEffect(() => {
    if (!provaId && !fileContent) return;

    const run = async () => {
      if (provaId) {
        try {
          const res = await fetch(`/api/prova-url?id=${provaId}`);
          const data = await res.json();
          if (data.url) await fetchAdapted(data.url);
          else if (fileContent) await fetchAdapted(fileContent.content);
        } catch (e) {
          if (fileContent) await fetchAdapted(fileContent.content);
        }
      } else if (fileContent) {
        await fetchAdapted(fileContent.content);
      }
    };

    run();
  }, [provaId, fileContent, fetchAdapted]);

  if (loading) return <div className={styles.loading}>Adaptando prova...</div>;
  if (error) return <div className={styles.error}>❌ {error}</div>;
  if (!adaptedData)
    return <p className={styles.info}>Aguardando adaptação...</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Questões Adaptadas</h3>

      {adaptedData.cabecalho && (
        <div className={styles.cabecalho}>
          <h4>Contexto da Prova</h4>
          <ReactMarkdown>{adaptedData.cabecalho}</ReactMarkdown>
        </div>
      )}

      <div className={styles.list}>
        {adaptedData.questoes.map((q, i) => {
          return (
            <div key={i} className={styles.card}>
              <p className={styles.original}>
                <b>Original:</b> {q.original}
              </p>
              <div className={styles.adaptada}>
                <b>Adaptada:</b>
                <ReactMarkdown>{q.adaptada}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}