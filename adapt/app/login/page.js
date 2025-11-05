"use client";

import { useState } from "react";
import Parse from "../back4app/parseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Footer } from "../../components/Footer/Footer";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await Parse.User.logIn(username, password);
      alert("Login feito com sucesso!");
      router.push("/dashboard");
    } catch (err) {
      setError("Usuário ou senha incorretos.");
    }
  }

  return (
    <>
    <main className={styles.main}>
      <Image
        src="/IdentidadeVisual/ADAPTbrancosemfundo.png"
        alt="Logo Adapt"
        width={180}
        height={60}
        className={styles.logo}
        priority
      />

      <div className={styles.card}>
        <h1 className={styles.title}>Fazer Login</h1>

        <form onSubmit={handleLogin} className={styles.form}>
          <label>Nome de usuário</label>
          <input
            type="text"
            placeholder="Digite seu nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className={styles.submitBtn}>
            Entrar
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>

        <p className={styles.loginLink}>
          Ainda não tem conta? <Link href="/signup">Crie agora</Link>
        </p>
      </div>     
    </main>
    <Footer />
    </>
  );
}
