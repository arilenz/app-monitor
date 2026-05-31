import type { App, CreateAppInput, Screenshot } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body.error === "string"
        ? body.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const api = {
  listApps: (): Promise<App[]> => request<App[]>("/apps"),
  getApp: (id: string): Promise<App> => request<App>(`/apps/${id}`),
  createApp: (input: CreateAppInput): Promise<App> =>
    request<App>("/apps", { method: "POST", body: JSON.stringify(input) }),
  deleteApp: (id: string): Promise<void> =>
    request<void>(`/apps/${id}`, { method: "DELETE" }),
  listScreenshots: (id: string): Promise<Screenshot[]> =>
    request<Screenshot[]>(`/apps/${id}/screenshots`),
};
