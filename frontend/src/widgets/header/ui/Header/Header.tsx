import { NavLeft } from "../NavLeft";
import { NavRigth } from "../NavRigth";
import styles from "./Header.module.scss";

export const Header = () => {
  return (
    <>
      <div className={styles.header}>
        <NavLeft />
        <NavRigth />
      </div>
    </>
  );
};
