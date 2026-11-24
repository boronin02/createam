import styles from "./NavLeft.module.scss";
import Link from "next/link";

export const NavLeft = () => {
  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        <li className={styles.text}>
          <Link href="/">
            <span className={styles.inner}>CREABOOM</span>
          </Link>
        </li>
        <li className={styles.text}>
          <Link href="/dashboard">
            <span className={styles.inner}>БИРЖА</span>
          </Link>
        </li>
        <li className={styles.text}>
          <Link href="/portfolio">
            <span className={styles.inner}>ПОРТФЕЛЬ</span>
          </Link>
        </li>
        <li className={styles.text}>
          <Link href="/reports">
            <span className={styles.inner}>ОТЧЁТЫ</span>
          </Link>
        </li>
        <li className={styles.text}>
          <Link href="/securities">
            <span className={styles.inner}>Ценные бумаги</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
