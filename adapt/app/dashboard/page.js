"use client";

import Parse from "../back4app/parseConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    async function getUserAndFetch() {
      const current = await Parse.User.currentAsync();
      if (current) {
        setUser(current);
        fetchProvas(current);
      } else {
        console.warn("⚠ Nenhum usuário logado detectado.");
      }
    }

    getUserAndFetch();
  }, []);

  async function fetchProvas(currentUser) {
    try {
      const Provas = Parse.Object.extend("Provas");
      const query = new Parse.Query(Provas);
      query.equalTo("usuario", currentUser);
      query.descending("createdAt");
      query.limit(5);

      const results = await query.find();
      console.log("📄 Provas encontradas:", results.length);

      const atividades = results.map((p) => ({
        title: p.get("arquivoAdaptado")?.name || "Prova Adaptada",
        date: new Date(p.createdAt).toLocaleDateString("pt-BR"),
        url: p.get("arquivoAdaptadoUrl") || "#",
      }));

      setRecentActivities(atividades);
    } catch (error) {
      console.error("❌ Erro ao buscar provas:", error);
      setRecentActivities([]);
    }
  }

  return (
    <main className={styles.main}>
      {user ? (
        <>
          <div className={styles.header}>
            <h1>Olá, {user.get("username")}</h1>
            <p>Bem-vindo ao seu painel do Adapt!</p>
            <p className={styles.subtitle}>
              Aqui você pode criar, revisar e acompanhar suas provas adaptadas.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/dashboard/upload" className={styles.uploadBtn}>
              Criar Nova Prova Adaptada
            </Link>

            <Link href="/dashboard/salvas" className={styles.savedBtn}>
              Ver Provas Salvas
            </Link>
          </div>

          <section className={styles.activities}>
            <h2>Atividades Recentes</h2>

            {Array.isArray(recentActivities) && recentActivities.length > 0 ? (
              <div className={styles.activityList}>
                {recentActivities
                  .filter(
                    (item) =>
                      item &&
                      (typeof item.title === "string" ||
                        typeof item.title === "object")
                  )
                  .map((item, index) => (
                    <a
                      href={item.url || "#"}
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.activityCard}
                    >
                      <div className={styles.activityIcon}>📄</div>
                      <div className={styles.activityInfo}>
                        <p className={styles.activityTitle}>
                          {typeof item.title === "string"
                            ? item.title
                            : item.title?.name || "Sem título"}
                        </p>
                        <p className={styles.activityDate}>
                          {item.date || "Data não informada"}
                        </p>
                      </div>
                    </a>
                  ))}
              </div>
            ) : (
              <p className={styles.noActivities}>
                Nenhuma prova encontrada ainda. Crie uma nova prova adaptada!
              </p>
            )}
          </section>
        </>
      ) : (
        <p>Você precisa estar logado.</p>
      )}
    </main>
  );
}