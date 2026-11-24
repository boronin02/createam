import { axiosInstance } from "@/shared/api/axiosInstance";

import type {
  Security,
  SecurityHistoryItem,
  SecurityHistoryParams,
} from "../model/types";

export const securityApi = {
  // Получить все бумаги
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

  // Получить историю цен
  getHistory: async (
    ticker: string,
    token: string,
    params?: SecurityHistoryParams,
  ): Promise<SecurityHistoryItem[]> => {
    const response = await axiosInstance.get<SecurityHistoryItem[]>(
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

  // Полная синхронизация бумаг
  sync: async (token: string): Promise<string> => {
    const response = await axiosInstance.post<string>(
      "/api/securities/sync",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  // Синхронизация акций и ETF
  syncMarket: async (token: string): Promise<string> => {
    const response = await axiosInstance.post<string>(
      "/api/securities/sync/market",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  // Синхронизация облигаций
  syncBonds: async (token: string): Promise<string> => {
    const response = await axiosInstance.post<string>(
      "/api/securities/sync/bonds",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },
};
