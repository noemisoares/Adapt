"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Header } from "../components/Header";
import Image from "next/image";
import { Footer } from "../components/Footer/Footer";

export default function Page() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      q: "Para quem é o Adapt?",
      a: "O Adapt é voltado para professores que desejam criar avaliações acessíveis e adaptadas para alunos neurodivergentes.",
    },
    {
      q: "Como posso começar?",
      a: "Basta criar uma conta gratuita, fazer login e começar a adaptar suas provas de forma simples e rápida.",
    },
    {
      q: "Ainda tenho dúvidas, como faço?",
      a: "Você pode entrar em contato com nossa equipe de suporte a qualquer momento pelo chat disponível no painel.",
    },
  ];

  return (
    <>
      <Header />
      <section className={styles.hero}>
        <Image
          src="/IdentidadeVisual/astronaut.png"
          alt="Astronauta"
          width={200}
          height={200}
          className={styles.astronaut}
        />

        <div className={styles.heroContent}>
          <h1>
            AVALIAÇÃO QUE <br />
            SE ADAPTA AO <span className={styles.stroke}>ESTUDANTE</span>
          </h1>

          <p className={styles.lead}>
            Nossa plataforma ajuda professores a adaptar provas de forma ágil e
            personalizada para alunos neurodivergentes. Com tecnologia
            inteligente, tornamos as avaliações mais inclusivas, mantendo a
            qualidade e dando ao estudante a chance de mostrar seu verdadeiro
            potencial.
          </p>

          <p className={styles.ribbon}>
            REVELE SEU VERDADEIRO POTENCIAL: AVALIE DE FORMA JUSTA, APRENDA SEM
            BARREIRAS E CONQUISTE RESULTADOS COM PROVAS INCLUSIVAS E
            PERSONALIZADAS.
          </p>

          {/* === CARDS === */}
          <div className={styles.features}>
            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/inclusao.png"
                alt="Ícone Inclusão"
              />
              <div className={styles.cardTitle}>INCLUSÃO REAL</div>
              <div className={styles.cardBody}>
                Provas adaptadas às necessidades de cada estudante, respeitando
                suas diferenças.
              </div>
            </div>

            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/agilidade.png"
                alt="Ícone Agilidade"
              />
              <div className={styles.cardTitle}>AGILIDADE PARA PROFESSORES</div>
              <div className={styles.cardBody}>
                Poucos cliques para transformar avaliações em versões
                acessíveis.
              </div>
            </div>

            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/justica.png"
                alt="Ícone Justiça"
              />
              <div className={styles.cardTitle}>JUSTIÇA NA AVALIAÇÃO</div>
              <div className={styles.cardBody}>
                Mais equidade e menos barreiras no desempenho dos alunos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className={styles.faq}>
        <div className={styles.wrap}>
          <h2>FAQ</h2>
          <h3>DÚVIDAS FREQUENTES</h3>

          <div className={styles.faqList}>
            {faqs.map((item, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${
                  openFAQ === index ? styles.open : ""
                }`}
                onClick={() => toggleFAQ(index)}
              >
                <div className={styles.faqHeader}>
                  <span className={styles.num}>
                    {String(index + 1).padStart(2, "0")}•
                  </span>
                  <span className={styles.faqQ}>{item.q}</span>
                  <span className={styles.toggleIcon}>
                    {openFAQ === index ? "−" : "+"}
                  </span>
                </div>

                <div
                  className={`${styles.faqA} ${
                    openFAQ === index ? styles.show : styles.hide
                  }`}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
