import { Header } from "../widgets/header/ui/Header";
import { HomePage } from "../pages/home/ui";
import { AppBackground } from "./ui/AppBackground/AppBackground";
import "../shared/assets/styles/global.scss";
import "../shared/assets/styles/reset.scss";
import styles from "./App.module.scss";

export const App = () => {
  return (
    <div className={styles.app}>
      <AppBackground />
      <div className={styles.content}>
        <Header />
        <HomePage />
      </div>
    </div>
  );
};
