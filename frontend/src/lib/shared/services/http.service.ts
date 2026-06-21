const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return (body.message as string) ?? "Something went wrong";
  } catch {
    return "Network error — please check your connection";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
