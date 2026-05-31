import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

export const queryKeys = {
  apps: ["apps"] as const,
  app: (id: string) => ["apps", id] as const,
  screenshots: (id: string) => ["apps", id, "screenshots"] as const,
};
