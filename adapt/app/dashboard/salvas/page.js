"use client";
import React, { useEffect, useState } from "react";
import { getProvasUser } from "@/app/back4app/provas/getProvasUser"; // 👈 use @ para caminho absoluto se possível
import styles from "./page.module.css"
import { deleteProva } from "@/app/back4app/provas/deleteProvas";

export default function SalvasPage() {
  const [provas, setProvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getProvasUser({ limit: 100, order: "-createdAt" });
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
  
  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta prova?")) return;

    try {
      await deleteProva(id);
      alert("Prova excluída com sucesso!");
      setProvas((prev) => prev.filter((p) => p.id !== id)); // atualiza lista local
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir a prova.");
    }
  };

  if (loading) return <div>Carregando suas provas...</div>;
  if (error) return <div style={{ color: "red" }}>Erro: {error}</div>;
  if (!provas.length) return <div>Você ainda não possui provas salvas.</div>;

  return (
    <div className={styles.main}>
      <h1>Provas Salvas</h1>
      <ul>
        {provas.map(p => (
          <li key={p.id}>
            <strong>{p.titulo}</strong><br />
            Enviada em: {p.criadoEm?.toLocaleString()}<br />
            {p.arquivoUrl ? (
              <>
                <a href={p.arquivoUrl} target="_blank">Abrir</a> ·{" "}
                <a href={p.arquivoUrl} download>Baixar</a>·{" "}
                <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  if (confirm(`Deseja realmente excluir "${p.titulo}"?`)) {
                    try {
                      await deleteProva(p.id);
                      setProvas(prev => prev.filter(prova => prova.id !== p.id));
                    } catch (err) {
                        alert("Erro ao excluir: " + err.message);
                    }
                  }
                }}
                style={{ color: "red", cursor: "pointer", textDecoration: "none" }}
              >
                Excluir
              </a>
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
