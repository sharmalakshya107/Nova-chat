import { type ApiResponse } from "@shared/types/api-response";

export const createResponse = <TData>(
  data: TData,
  message?: string
): ApiResponse<TData> => ({
  success: true,
  message,
  data,
});
