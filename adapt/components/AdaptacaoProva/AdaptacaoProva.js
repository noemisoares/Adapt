"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./AdaptacaoProva.module.css";

export default function AdaptacaoProva({ provaId, fileContent, onAdapted }) {
  const [loading, setLoading] = useState(false);
  const [adaptedData, setAdaptedData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdapted = useCallback(
    async (urlOrBase64) => {
      try {
        setLoading(true);
        setError(null);

        const isUrl = urlOrBase64.startsWith("http");
        const res = await fetch("/api/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isUrl ? { url: urlOrBase64 } : { base64Content: urlOrBase64 }
          ),
        });

        if (!res.ok) throw new Error("Erro na adaptação");

        const data = await res.json();
        setAdaptedData(data.adapted);
        onAdapted?.(data.adapted);
      } catch (err) {
        console.error("Erro ao adaptar:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [onAdapted]
  );

  useEffect(() => {
    if (!provaId && !fileContent) return;

    if (provaId) {
      (async () => {
        try {
          const res = await fetch(`/api/prova-url?id=${provaId}`);
          const data = await res.json();
          if (data.url) fetchAdapted(data.url);
          else if (fileContent) fetchAdapted(fileContent.content);
        } catch {
          if (fileContent) fetchAdapted(fileContent.content);
        }
      })();
    } else if (fileContent) {
      fetchAdapted(fileContent.content);
    }
  }, [provaId, fileContent, fetchAdapted]);

  if (loading) return <div className={styles.loading}>Adaptando prova...</div>;

  if (error) return <div className={styles.error}>❌ {error}</div>;

  if (!adaptedData)
    return <p className={styles.info}>Aguardando adaptação...</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Questões Adaptadas</h3>
      <div className={styles.list}>
        {adaptedData.questoes.map((q, i) => (
          <div key={i} className={styles.card}>
            <p className={styles.original}>
              <b>Original:</b> {q.original}
            </p>
            <p className={styles.adaptada}>
              <b>Adaptada:</b> {q.adaptada}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
