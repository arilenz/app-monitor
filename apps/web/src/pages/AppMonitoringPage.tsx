import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ScreenshotTimeline } from "../components/ScreenshotTimeline";
import { StoreBadge } from "../components/StoreBadge";
import { api } from "../lib/api";
import { formatDateTime, formatLocale } from "../lib/format";
import { queryKeys } from "../lib/queryClient";

export const AppMonitoringPage = () => {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const appQuery = useQuery({
    queryKey: queryKeys.app(id),
    queryFn: () => api.getApp(id),
    enabled: id !== "",
  });

  const renderApp = () => {
    if (appQuery.isPending) {
      return <p className="text-sm text-gray-500">Loading…</p>;
    }

    if (appQuery.error) {
      return (
        <p className="text-sm text-red-600">
          {appQuery.error instanceof Error ? appQuery.error.message : "Failed to load app"}
        </p>
      );
    }

    const app = appQuery.data;

    return (
      <>
        <header className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{app.name ?? app.appId}</h1>
            <StoreBadge store={app.store} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{app.appId}</p>
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-indigo-600 hover:underline"
          >
            {app.url}
          </a>
          <p className="mt-2 text-xs text-gray-400">
            Locale: {formatLocale(app.hl, app.gl)} · Added {formatDateTime(app.createdAt)}
          </p>
        </header>

        <ScreenshotTimeline appId={app._id} />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-block text-sm text-indigo-600 hover:underline">
        ← Back to all apps
      </Link>
      {renderApp()}
    </div>
  );
};
