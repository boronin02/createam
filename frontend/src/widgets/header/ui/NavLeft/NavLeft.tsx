import styles from "./NavLeft.module.scss";

export const NavLeft = () => {
  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        <li className={styles.text}>
          <span className={styles.inner}>CREABOOM</span>
        </li>
        <li className={styles.text}>
          <span className={styles.inner}>БИРЖА</span>
        </li>
        <li className={styles.text}>
          <span className={styles.inner}>ПОРТФЕЛЬ</span>
        </li>
      </ul>
    </nav>
  );
};
