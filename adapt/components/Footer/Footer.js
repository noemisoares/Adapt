import styles from './Footer.module.css';
import Link from "next/link";

export function Footer() {
    return (
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 Adapt, Inc.</p>
          <nav>
            <Link href="/">Início</Link>
            <Link href="/sobre">Quem Somos?</Link>
            <Link href="#">Parcerias</Link>
            <Link href="#">Termos & Privacidade</Link>
          </nav>
        </div>
      </footer>
    );
}  