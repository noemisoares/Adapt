"use client";

import styles from "./page.module.css";
import { Header } from "../../components/Header";
import Image from "next/image";

export default function Sobre() {
  return (
    <>
      <Header />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            QUEM <span className={styles.stroke}>SOMOS?</span>
          </h1>

          <p className={styles.lead}>
            Somos um grupo de estudantes da UNICAP dedicados a desenvolver
            soluções tecnológicas que promovam inclusão e acessibilidade na
            educação. Nosso projeto, Adapt, nasceu da necessidade de apoiar
            professores na adaptação de provas para alunos neurodivergentes, com
            foco inicial no TDAH.
          </p>

          <p className={styles.lead}>
            Acreditamos que a tecnologia pode ser uma aliada poderosa na
            construção de avaliações mais justas, claras e acessíveis,
            garantindo que todos os alunos tenham a oportunidade de demonstrar
            seu verdadeiro potencial.
          </p>

          <p className={styles.ribbon}>
            MERGULHEM EM UMA NOVA FORMA DE APRENDER: AVALIAÇÕES ADAPTADAS QUE
            VALORIZAM SUAS HABILIDADES E ABREM CAMINHOS PARA O SEU FUTURO.
          </p>

          {/* === CARDS === */}
          <div className={styles.features}>
            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/inclusao-missao.png"
                alt="Ícone Inclusão com Missão"
              />
              <div className={styles.cardTitle}>INCLUSÃO COMO MISSÃO</div>
              <div className={styles.cardBody}>
                Acreditamos que cada estudante merece condições justas para
                demonstrar conhecimento.
              </div>
            </div>

            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/tecnologia.png"
                alt="Ícone Tecnologia"
              />
              <div className={styles.cardTitle}>
                TECNOLOGIA A FAVOR DA EDUCAÇÃO
              </div>
              <div className={styles.cardBody}>
                Inovação que acelera a criação de provas adaptadas às
                necessidades reais.
              </div>
            </div>

            <div className={styles.card}>
              <img
                src="/IdentidadeVisual/icones/humano.png"
                alt="Ícone Impacto Humano"
              />
              <div className={styles.cardTitle}>IMPACTO HUMANO</div>
              <div className={styles.cardBody}>
                Mais do que avaliações, buscamos qualidade de vida e
                reconhecimento para todos.
              </div>
            </div>
          </div>

          <div className={styles.finalCall}>
            <h2>COMECE A CRIAR AGORA!</h2>
            <a href="#" className={styles.link}>
              Conecte-se Conosco!
            </a>
          </div>
        </div>
      </section>
      {/* === FOOTER === */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 Adapt, Inc.</p>
          <nav>
            <a href="#">Quem Somos?</a>
            <a href="#">Parcerias</a>
            <a href="#">Termos & Privacidade</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
