import { axiosInstance } from "@/shared/api/axiosInstance";
import type { PortfolioItem, PortfolioSummary } from "../model/types";

export const portfolioApi = {
  getPortfolio: async (
    accountId: number,
    token: string,
  ): Promise<PortfolioItem[]> => {
    const response = await axiosInstance.get<PortfolioItem[]>(
      `/api/portfolio/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  getSummary: async (
    accountId: number,
    token: string,
  ): Promise<PortfolioSummary> => {
    const response = await axiosInstance.get<PortfolioSummary>(
      `/api/portfolio/${accountId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },
};
