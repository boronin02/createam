import styles from "./AppBackground.module.scss";

export const AppBackground = () => (
  <div className={styles.bg} aria-hidden="true">
    <div className={styles.cam} />
    <div className={styles.steam}>
      <i />
      <i />
      <i />
      <i />
    </div>
    <div className={styles.holo} />
    <div className={styles.scan} />
    <div className={styles.glint} />
  </div>
);
