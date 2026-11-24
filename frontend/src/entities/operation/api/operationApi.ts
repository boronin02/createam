import { axiosInstance } from "@/shared/api/axiosInstance";
import type { CreateOperationDto } from "../model/types";

export const operationApi = {
  create: async (data: CreateOperationDto, token: string): Promise<string> => {
    const response = await axiosInstance.post<string>("/api/operations", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};
