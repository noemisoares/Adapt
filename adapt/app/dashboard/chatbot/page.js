"use client";

import Image from "next/image";
import styles from "./page.module.css";

export default function ChatBotPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image
            src="/IdentidadeVisual/chatbotAdapt.png"
            alt="Mascote do Adapt"
            width={300}
            height={300}
            priority
          />
        </div>

        <h1 className={styles.title}>Página em Desenvolvimento</h1>
        <p className={styles.text}>
          Nosso assistente AdaptBot está quase pronto para ajudar você nas suas
          provas adaptadas! 🚀
        </p>
      </div>
    </main>
  );
}
