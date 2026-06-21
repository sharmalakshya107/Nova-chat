export interface ApiResponse<TData> {
  success: boolean;
  message?: string;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error_code: number;
  message: string;
  data: Record<string, unknown>;
}
