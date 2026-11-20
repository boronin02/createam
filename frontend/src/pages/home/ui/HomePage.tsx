import styles from "./HomePage.module.scss";

export const HomePage = () => {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>CREABOOM</h1>
        <p className={styles.subtitle}>
          Учёт ценных бумаг для тех, кто держит всё под контролем
        </p>
      </section>

      {/* сюда — остальные секции главной */}
    </main>
  );
};
