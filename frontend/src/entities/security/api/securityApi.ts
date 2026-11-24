import { axiosInstance } from "@/shared/api/axiosInstance";
import type { Security, SecurityHistory } from "../model/types";

export const securityApi = {
  // Получить все ценные бумаги
  getAll: async (token: string): Promise<Security[]> => {
    const response = await axiosInstance.get<Security[]>("/api/securities", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Получить бумагу по тикеру
  getByTicker: async (ticker: string, token: string): Promise<Security> => {
    const response = await axiosInstance.get<Security>(
      `/api/securities/${encodeURIComponent(ticker)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  // Получить историю цены
  getHistory: async (
    ticker: string,
    token: string,
    params?: {
      from?: string;
      till?: string;
      interval?: string;
    },
  ): Promise<SecurityHistory[]> => {
    const response = await axiosInstance.get<SecurityHistory[]>(
      `/api/securities/${encodeURIComponent(ticker)}/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      },
    );

    return response.data;
  },
};
