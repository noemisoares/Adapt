"use client";
import styles from "./VisualizacaoProva.module.css";

export default function VisualizacaoProva({
  parsedQuestions,
  originalQuestions,
}) {
  const questions = parsedQuestions?.length
    ? parsedQuestions
    : originalQuestions || [];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Questões Extraídas</h3>

      {!questions?.length ? (
        <p className={styles.empty}>Nenhuma questão identificada ainda.</p>
      ) : (
        <div className={styles.list}>
          {questions.map((q, i) => (
            <div key={q.id || i} className={styles.question}>
              <span className={styles.index}>Questão {i + 1}</span>
              <p className={styles.text}>{q.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}