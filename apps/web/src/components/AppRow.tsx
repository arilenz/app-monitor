import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDateTime, formatLocale } from "../lib/format";
import { queryKeys } from "../lib/queryClient";
import type { App } from "../types";
import { StoreBadge } from "./StoreBadge";

interface AppRowProps {
  app: App;
}

export const AppRow = (props: AppRowProps) => {
  const app = props.app;
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteApp(app._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.apps }),
  });

  const handleDelete = () => {
    if (!window.confirm("Stop tracking this app and delete its screenshots?")) {
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <Link to={`/apps/${app._id}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium text-indigo-700">
          <span className="truncate hover:underline">{app.name ?? app.appId}</span>
          <StoreBadge store={app.store} />
        </p>
        <p className="truncate text-sm text-gray-500">{app.appId}</p>
        <p className="mt-1 text-xs text-gray-400">
          Locale: {formatLocale(app.hl, app.gl)} · Added {formatDateTime(app.createdAt)}
        </p>
      </Link>
      <button
        type="button"
        disabled={deleteMutation.isPending}
        onClick={handleDelete}
        className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </li>
  );
};
