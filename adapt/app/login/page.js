"use client";

import { useState } from "react";
import Parse from "../back4app/parseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="p-6 flex flex-col items-center">
        <Link href="/">
          Voltar para Homepage
        </Link>

      <h1 className="text-xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-64">
        <input
          type="text"
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="btn bg-blue-500 text-white">
          Entrar
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </main>
  );
}
