"use client";

import Parse from "../back4app/parseConfig";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const current = Parse.User.current();
    if (current) setUser(current);
  }, []);

  return (
    <main className="p-6 flex flex-col items-center">
      {user ? (
        <>
          <h1 className="text-2xl font-bold mb-4">
            Olá, {user.get("username")} 👋
          </h1>
          <p>Bem-vindo ao seu painel.</p>
          <Link href="/logout" className="mt-4 text-blue-500 underline">
            Sair
          </Link>
          <div className="dashboard-actions">
            <Link href="/dashboard/upload" className="btn upload-btn">
              Criar Nova Prova Adaptada
            </Link>

            <Link href="/dashboard/provas" className="btn saved-btn">
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
