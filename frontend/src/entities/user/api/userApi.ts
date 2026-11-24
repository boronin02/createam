import { axiosInstance } from "@/shared/api/axiosInstance";
import type { CurrentUser } from "../model/types";

export const userApi = {
  getMe: async (token: string): Promise<CurrentUser> => {
    const response = await axiosInstance.get<CurrentUser>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};
