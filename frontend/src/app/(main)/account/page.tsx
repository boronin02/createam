"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/entities/user/api/userApi";
import type { CurrentUser } from "@/entities/user/model/types";
import styles from "./account.module.scss";

export default function AccountPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Необходимо авторизоваться");
          return;
        }

        const data = await userApi.getMe(token);
        setUser(data);
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        setError("Не удалось загрузить данные профиля");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const fullName = user
    ? [user.last_name, user.first_name, user.middle_name]
        .filter(Boolean)
        .join(" ")
    : "";

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.message}>Загрузка профиля...</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>{error || "Профиль не найден"}</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {user.first_name?.[0]?.toUpperCase() || "П"}
          </div>

          <div>
            <h1 className={styles.title}>Профиль</h1>
          </div>
        </div>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Личные данные</h2>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>ФИО</span>
              <span className={styles.value}>{fullName || "Не указано"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>Логин</span>
              <span className={styles.value}>{user.username}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user.email || "Не указан"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>Телефон</span>
              <span className={styles.value}>{user.phone || "Не указан"}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>ИНН</span>
              <span className={styles.value}>{user.inn || "Не указан"}</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Информация аккаунта</h2>

          <div className={styles.infoItem}>
            <span className={styles.label}>ID инвестора</span>
            <span className={styles.value}>{user.id_investor}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
