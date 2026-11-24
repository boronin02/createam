import { Routes, Route } from "react-router-dom";
import { HomePage } from "../../../pages/home/ui";
import { LoginPage } from "../../../pages/login/ui";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
