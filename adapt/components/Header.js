"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";
import { useEffect, useState } from "react";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topStripe}></div>

      <nav className={styles.navbar}>
        {/* === LOGO === */}
        <div className={styles.logoContainer}>
          <Image
            src="/Identidade_Visual/adapt-logo.png"
            alt="Adapt"
            width={130}
            height={45}
            className={styles.logo}
            priority
          />
        </div>

        {/* === LINKS PRINCIPAIS === */}
        <ul className={styles.navList}>
          <li>
            <Link href="/">Início</Link>
          </li>
          <li>
            <Link href="/sobre">Sobre Nós</Link>
          </li>
          <li>
            <Link href="/recursos">Recursos</Link>
          </li>
        </ul>

        {/* === AÇÕES (LOGIN / CADASTRO) === */}
        <div className={styles.rightSide}>
          <Link href="/login" className={styles.btnOutline}>
            Fazer Login
          </Link>
          <Link href="/signup" className={styles.btnPrimary}>
            Criar Conta
          </Link>
          {/*
          <button
            className="theme-button"
            onClick={() => setDarkMode((s) => !s)}
            aria-label="Alternar tema claro/escuro"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          */}
        </div>
      </nav>

      <div className={styles.bottomStripe}></div>
    </header>
  );
}