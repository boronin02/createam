import { axiosInstance } from "@/shared/api/axiosInstance";
import type { Account, CreateAccountDto } from "../model/types";

export const accountApi = {
  getMyAccounts: async (token: string): Promise<Account[]> => {
    const response = await axiosInstance.get<Account[]>("/api/accounts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  create: async (data: CreateAccountDto, token: string): Promise<string> => {
    const response = await axiosInstance.post<string>("/api/accounts", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};
