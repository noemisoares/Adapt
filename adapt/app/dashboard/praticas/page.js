"use client";

import Image from "next/image";
import styles from "./page.module.css";

export default function BoasPraticasPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image
            src="/IdentidadeVisual/meioADAPT.png"
            alt="Logo Adapt"
            width={300}
            height={150}
            priority
          />
        </div>

        <h1 className={styles.title}>Página em Desenvolvimento</h1>
        <p className={styles.text}>
          Em breve, você encontrará aqui dicas e práticas recomendadas para
          criar provas adaptadas com mais eficiência e inclusão. 💡
        </p>
      </div>
    </main>
  );
}
