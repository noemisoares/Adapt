"use client";

import { useState } from "react";
import Parse from "../back4app/parseConfig";
import { useRouter } from "next/navigation";

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
    <main className="p-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Criar Conta</h1>
      <form onSubmit={handleSignUp} className="flex flex-col gap-3 w-64">
        <input
          type="text"
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          Criar conta
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </main>
  );
}