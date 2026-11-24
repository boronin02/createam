import { axiosInstance } from "@/shared/api/axiosInstance";

const getHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const reportApi = {
  getOperations: async (token: string) => {
    const response = await axiosInstance.get(
      "/api/reports/operations",
      getHeaders(token),
    );
    return response.data;
  },

  getIncomes: async (token: string) => {
    const response = await axiosInstance.get(
      "/api/reports/incomes",
      getHeaders(token),
    );
    return response.data;
  },

  getFreshness: async (token: string) => {
    const response = await axiosInstance.get(
      "/api/reports/freshness",
      getHeaders(token),
    );
    return response.data;
  },

  getCommissions: async (token: string) => {
    const response = await axiosInstance.get(
      "/api/reports/commissions",
      getHeaders(token),
    );
    return response.data;
  },
};
