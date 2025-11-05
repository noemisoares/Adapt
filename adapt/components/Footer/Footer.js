import styles from './Footer.module.css';

export function Footer() {
    return (
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 Adapt, Inc.</p>
          <nav>
            <a href="/">Início</a>
            <a href="/sobre">Quem Somos?</a>
            <a href="#">Parcerias</a>
            <a href="#">Termos & Privacidade</a>
          </nav>
        </div>
      </footer>
    );
}  