"use client";
import { useState } from "react";
import Parse from "../back4app/parseConfig";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import { Footer } from "../../components/Footer/Footer";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignUp(e) {
    e.preventDefault();
    try {
      const user = new Parse.User();
      user.set("username", username);
      user.set("email", email);
      user.set("password", password);

      await user.signUp();
      alert("Conta criada com sucesso!");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
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
        <h1 className={styles.title}>Criar Conta</h1>
        <form onSubmit={handleSignUp} className={styles.form}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.submitBtn}>
            Criar conta
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
        <p className={styles.loginLink}>
          Já tem conta? <a href="/login">Faça login</a>
        </p>
      </div>
    </main>
     <Footer />
     </>  );
}