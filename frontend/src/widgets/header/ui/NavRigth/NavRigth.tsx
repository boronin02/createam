import Link from "next/link";
import { Clock } from "../Clock/Clock";
import styles from "./NavRigth.module.scss";

export const NavRigth = () => {
  return (
    <>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          <li className={styles.text}>
            <Link href="/auth" className={styles.inner}>
              Войти
            </Link>
          </li>
          <li className={styles.text}>
            <Clock />
          </li>
        </ul>
      </nav>
    </>
  );
};
