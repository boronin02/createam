"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "../Clock/Clock";
import { useAuth } from "@/entities/auth/model/AuthContext";
import styles from "./NavRigth.module.scss";

export const NavRigth = () => {
  const { user, isReady, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/home");
  };

  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        <li className={styles.text}>
          {!isReady ? (
            <span className={styles.inner}>...</span>
          ) : user ? (
            <>
              <Link href="/account" className={styles.inner}>
                {user.username}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.inner}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link href="/auth" className={styles.inner}>
              Войти
            </Link>
          )}
        </li>

        <li className={styles.text}>
          <Clock />
        </li>
      </ul>
    </nav>
  );
};
