import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryClient";
import type { Screenshot } from "../types";
import { ScreenshotCard } from "./ScreenshotCard";

const POLL_INTERVAL_MS = 1000;

const TimelineList = (props: { screenshots: Screenshot[] }) => {
  if (props.screenshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        No screenshots yet. Captures will appear here on this timeline once the
        capture job runs.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {props.screenshots.map((screenshot) => (
        <ScreenshotCard key={screenshot._id} screenshot={screenshot} />
      ))}
    </ul>
  );
};

interface ScreenshotTimelineProps {
  appId: string;
}

export const ScreenshotTimeline = (props: ScreenshotTimelineProps) => {
  const query = useQuery({
    queryKey: queryKeys.screenshots(props.appId),
    queryFn: () => api.listScreenshots(props.appId),
    enabled: props.appId !== "",
    // Poll once per second while any screenshot is still pending; stop
    // otherwise. Polling pauses while the tab is backgrounded (default) and
    // refetchOnWindowFocus pulls the latest state when the user returns.
    refetchInterval: (current) => {
      const screenshots = current.state.data ?? [];
      const hasPending = screenshots.some((screenshot) => screenshot.status === "pending");
      return hasPending ? POLL_INTERVAL_MS : false;
    },
    refetchOnWindowFocus: true,
  });

  if (query.isPending) {
    return <p className="text-sm text-gray-500">Loading screenshots…</p>;
  }

  if (query.error) {
    return (
      <p className="text-sm text-red-600">
        {query.error instanceof Error ? query.error.message : "Failed to load screenshots"}
      </p>
    );
  }

  const screenshots = query.data;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
        Screenshot timeline {screenshots.length > 0 && `(${screenshots.length})`}
        {query.isRefetching && (
          <span className="text-xs font-normal text-gray-400">updating…</span>
        )}
      </h2>

      <TimelineList screenshots={screenshots} />
    </section>
  );
};
