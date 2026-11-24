import { axiosInstance } from "@/shared/api/axiosInstance";
import type { Account } from "../model/types";

export const accountApi = {
  getMyAccounts: async (token: string): Promise<Account[]> => {
    const response = await axiosInstance.get<Account[]>("/api/accounts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};
