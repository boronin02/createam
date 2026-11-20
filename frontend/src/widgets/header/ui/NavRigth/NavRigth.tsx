import { Clock } from "../Clock/Clock";
import styles from "./NavRigth.module.scss";

export const NavRigth = () => {
  return (
    <>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          <li className={styles.text}>
            <span className={styles.inner}>Войти</span>
          </li>
          <li className={styles.text}>
            <Clock />
          </li>
        </ul>
      </nav>
    </>
  );
};
