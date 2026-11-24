import { axiosInstance } from "@/shared/api/axiosInstance";

export type RegisterData = {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type LoginData = {
  username: string;
  password: string;
};

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosInstance.post("/api/auth/register", data);

    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await axiosInstance.post("/api/auth/login", data);

    return response.data;
  },
};
