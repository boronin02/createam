import { api } from "./axiosInstance";

export const registerUser = async (body: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}) => {
  const { data } = await api.post("/api/auth/register", body);
  console.log("REGISTER RESPONSE:", data);
  return data;
};

export const login = async (body: { username: string; password: string }) => {
  const { data } = await api.post("/api/auth/login", body);
  console.log("LOGIN RESPONSE:", data);
  return data;
};
