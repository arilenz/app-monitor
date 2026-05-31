import type { ScreenshotStatus } from "../types";

const STYLES: Record<ScreenshotStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  complete: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

interface StatusBadgeProps {
  status: ScreenshotStatus;
}

export const StatusBadge = (props: StatusBadgeProps) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[props.status]}`}
  >
    {props.status}
  </span>
);
