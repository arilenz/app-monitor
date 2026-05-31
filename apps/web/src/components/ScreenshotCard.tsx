import { useState } from "react";
import { formatDateTime } from "../lib/format";
import type { Screenshot } from "../types";
import { StatusBadge } from "./StatusBadge";

const placeholderText = (screenshot: Screenshot): string => {
  if (screenshot.status === "failed") return screenshot.error ?? "Capture failed";
  return "No image yet";
};

interface ScreenshotCardProps {
  screenshot: Screenshot;
}

export const ScreenshotCard = (props: ScreenshotCardProps) => {
  const screenshot = props.screenshot;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage =
    screenshot.status === "complete" && Boolean(screenshot.imagePath) && !imageFailed;

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <time className="text-sm font-medium text-gray-700">
          {formatDateTime(screenshot.createdAt)}
        </time>
        <StatusBadge status={screenshot.status} />
      </div>

      <div className="flex aspect-3/4 items-center justify-center bg-gray-50 p-2">
        {showImage ? (
          <img
            src={screenshot.imagePath}
            alt={`Listing captured ${formatDateTime(screenshot.createdAt)}`}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="px-4 text-center text-sm text-gray-400">
            {placeholderText(screenshot)}
          </p>
        )}
      </div>
    </li>
  );
};
