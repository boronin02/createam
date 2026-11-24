"use client";

import { useState } from "react";
import axios from "axios";
import styles from "./AuthForm.module.scss";
import { authApi } from "@/entities/auth/api/authApi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/auth/model/AuthContext";

type AuthMode = "login" | "register";

type FormData = {
  username: string;
  password: string;
  email: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const { login } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    username: "12345",
    password: "12345",
    email: "12345@example.com",
    confirmPassword: "12345",
    firstName: "12345",
    lastName: "12345",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleChangeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (isSubmitting) return;

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await authApi.register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });

        setMode("login");

        setFormData((prev) => ({
          ...prev,
          email: "",
          confirmPassword: "",
        }));

        return;
      }

      const response = await authApi.login({
        username: formData.username,
        password: formData.password,
      });

      if (!response.token) {
        throw new Error("Сервер не вернул токен авторизации");
      }

      login(response.token, formData.username);
      router.replace("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Ошибка при обращении к серверу",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Произошла неизвестная ошибка",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.auth}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>
          {mode === "login" ? "Войти" : "Регистрация"}
        </h1>

        <p className={styles.subtitle}>
          {mode === "login"
            ? "Войдите в свой аккаунт"
            : "Создайте новый аккаунт"}
        </p>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Введите username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {mode === "register" && (
            <>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Введите email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Повторите пароль</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Повторите пароль"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="firstNane">Имя</label>
                <input
                  id="firstNane"
                  name="firstNane"
                  type="text"
                  placeholder="Имя"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="lastName">Фамилия</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Фамилия"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Отправка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>

        <p className={styles.switchText}>
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}

          <button
            type="button"
            onClick={() =>
              handleChangeMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </form>
    </div>
  );
}
