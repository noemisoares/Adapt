"use client";

import Parse from "../back4app/parseConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const current = Parse.User.current();
    if (current) setUser(current);
  }, []);

  return (
    <main className={styles.main}>
      {user ? (
        <>
          <div className={styles.header}>
            <h1>Olá, {user.get("username")}</h1>
            <p>Bem-vindo ao seu painel.</p>
            <p>Você precisa estar logado.</p>
          </div>

          <div className={styles.actions}>
            <Link href="/dashboard/upload" className={styles.uploadBtn}>
              Criar Nova Prova Adaptada
            </Link>

            <Link href="/dashboard/provas" className={styles.savedBtn}>
              Ver Provas Salvas
            </Link>
          </div>
        </>
      ) : (
        <p>Você precisa estar logado.</p>
      )}
    </main>
  );
}
