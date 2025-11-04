"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode ? "true" : "false");
  }, [darkMode, mounted]);

  if (!mounted) return null;

  return (
    <header className="header">
      <nav className="navbar">
        <div className="logoContainer">
          <Image
            src="/IdentidadeVisual/ADAPTlaranjasemfundo.png"
            alt="Adapt"
            width={130}
            height={45}
            className="logo"
            priority
          />
        </div>

        <ul className="navList">
          <li>
            <Link href="/">Início</Link>
          </li>
          <li>
            <Link href="/sobre">Sobre Nós</Link>
          </li>
          <li>
            <Link href="/">Recursos</Link>
          </li>
        </ul>

        <div className="rightSide">
          <Link href="/signup" className="btnOutline">
            Criar conta
          </Link>
          <Link href="/login" className="btnPrimary">
            Fazer login
          </Link>

          <button
            className="btnOutline"
            onClick={() => setDarkMode((s) => !s)}
            aria-label="Alternar tema claro/escuro"
          >
            {darkMode ? "☀︎" : "☾"}
          </button>
        </div>
      </nav>
    </header>
  );
}
