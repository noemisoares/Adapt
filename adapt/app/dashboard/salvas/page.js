"use client";

import React, { useEffect, useState } from "react";
import { getProvasUser } from "@/app/back4app/provas/getProvasUser";
import { deleteProva } from "@/app/back4app/provas/deleteProvas";
import styles from "./page.module.css";

export default function SalvasPage() {
  const [provas, setProvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getProvasUser({ limit: 100, order: "-createdAt" });

        const adaptadas = res.filter((p) => p.arquivoAdaptadoUrl); //new
        if (mounted) setProvas(adaptadas); //new

        //if (mounted) setProvas(res);
      } catch (err) {
        console.error("Erro buscando provas:", err);
        if (mounted) setError(err.message || "Erro desconhecido");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = async (id, titulo) => {
    if (!confirm(`Deseja realmente excluir "${titulo}"?`)) return;

    try {
      await deleteProva(id);
      setProvas((prev) => prev.filter((p) => p.id !== id));
      alert("Prova excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir a prova.");
    }
  };

  if (loading)
    return <div className={styles.loading}>Carregando suas provas...</div>;

  if (error)
    return <div className={styles.error}>Erro ao carregar: {error}</div>;

  if (!provas.length)
    return (
      <div className={styles.noProvas}>
        <h2>Você ainda não possui provas salvas.</h2>
        <p>
          Crie sua primeira prova adaptada clicando em{" "}
          <a href="/dashboard/upload">Nova Prova</a>.
        </p>
      </div>
    );

  // 📊 Resumo
  const totalProvas = provas.length;
  const ultimaProva = provas[0];
  const ultimaData = ultimaProva?.criadoEm
    ? ultimaProva.criadoEm.toLocaleDateString("pt-BR")
    : "-";

  // 📈 Agrupa por mês (para gráfico)
  const provasPorMes = provas.reduce((acc, p) => {
    const data = new Date(p.criadoEm);
    const mes = data.toLocaleString("pt-BR", { month: "short" });
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {});

  const meses = Object.keys(provasPorMes);
  const valores = Object.values(provasPorMes);
  const maxValor = Math.max(...valores, 1);

  return (
    <div className={styles.main}>
      <header className={styles.header}>
        <h1>Provas Salvas</h1>
        <p>Gerencie suas provas adaptadas recentes.</p>
      </header>

      {/* === Painel de Resumo === */}
      <section className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total de Provas</span>
          <h2 className={styles.summaryValue}>{totalProvas}</h2>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Última Criada</span>
          <h2 className={styles.summaryValue}>{ultimaData}</h2>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Mais Recente</span>
          <h2 className={styles.summaryValue}>
            {ultimaProva?.titulo || "Sem título"}
          </h2>
        </div>
      </section>

      {/* === Gráfico de Provas por Mês === */}
      <section className={styles.chartSection}>
        <h2>Provas Criadas por Mês</h2>
        <div className={styles.chartContainer}>
          {meses.map((mes, i) => (
            <div key={mes} className={styles.barGroup}>
              <div
                className={styles.bar}
                style={{
                  height: `${(valores[i] / maxValor) * 140}px`,
                }}
              ></div>
              <span className={styles.barLabel}>{mes}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === Lista de Provas === */}
      <section className={styles.cardsGrid}>
        {provas.map((p) => (
          <div key={p.id} className={styles.card}>
            <div className={styles.cardIcon}>📄</div>
            <div className={styles.cardBody}>
              <h3>{p.titulo || "Prova sem título"}</h3>
              <p className={styles.cardDate}>
                {p.criadoEm
                  ? `Enviada em ${p.criadoEm.toLocaleDateString("pt-BR")}`
                  : "Data não disponível"}
              </p>

              <div className={styles.cardActions}>
                {p.arquivoUrl ? (
                  <>
                    <a
                      //href={p.arquivoUrl}
                      href={p.arquivoAdaptadoUrl} //
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openBtn}
                    >
                      Abrir
                    </a>
                    <a
                      //href={p.arquivoUrl}
                      href={p.arquivoAdaptadoUrl} //
                      download
                      className={styles.downloadBtn}
                    >
                      Baixar
                    </a>
                  </>
                ) : (
                  <span className={styles.noFile}>Sem arquivo</span>
                )}

                <button
                  onClick={() => handleDelete(p.id, p.titulo)}
                  className={styles.deleteBtn}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
          
        ))}
      </section>
    </div>
  );
}
