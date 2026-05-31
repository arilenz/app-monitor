import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryClient";
import { AppRow } from "./AppRow";

export const AppsList = () => {
  const appsQuery = useQuery({ queryKey: queryKeys.apps, queryFn: api.listApps });

  const renderApps = () => {
    if (appsQuery.isPending) {
      return <p className="text-sm text-gray-500">Loading…</p>;
    }

    if (appsQuery.error) {
      return (
        <p className="text-sm text-red-600">
          {appsQuery.error instanceof Error ? appsQuery.error.message : "Failed to load apps"}
        </p>
      );
    }

    const apps = appsQuery.data;

    if (apps.length === 0) {
      return (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No apps tracked yet. Add one above to get started.
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {apps.map((app) => (
          <AppRow key={app._id} app={app} />
        ))}
      </ul>
    );
  };

  const appCount = appsQuery.data?.length ?? 0;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Tracked apps {appCount > 0 && `(${appCount})`}
      </h2>

      {renderApps()}
    </section>
  );
};
