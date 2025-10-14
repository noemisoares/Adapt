"use client";
import React, { useEffect, useState } from "react";
import { getProvasDoUsuario } from "@/app/back4app/provas/getProvasDoUsuario"; // 👈 use @ para caminho absoluto se possível
import styles from "./page.module.css"

export default function SalvasPage() {
  const [provas, setProvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getProvasDoUsuario({ limit: 100, order: "-createdAt" });
        if (mounted) setProvas(res);
      } catch (err) {
        console.error("Erro buscando provas:", err);
        if (mounted) setError(err.message || "Erro desconhecido");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Carregando suas provas...</div>;
  if (error) return <div style={{ color: "red" }}>Erro: {error}</div>;
  if (!provas.length) return <div>Você ainda não possui provas salvas.</div>;

  return (
    <div className={styles.main}>
      <h1>Provas Salvas</h1>
      <ul>
        {provas.map(p => (
          <li key={p.id}>
            <strong>{p.titulo || `Prova ${p.id}`}</strong><br />
            Enviada em: {p.criadoEm?.toLocaleString()}<br />
            {p.arquivoUrl ? (
              <>
                <a href={p.arquivoUrl} target="_blank">Abrir</a> ·{" "}
                <a href={p.arquivoUrl} download>Baixar</a>
              </>
            ) : (
              "Sem arquivo"
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
