import styles from "./page.module.css";
import { Header } from "../components/Header";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h2>Bem-vindo ao Adapt Homepage</h2>
      </main>
    </div>
  );
}
