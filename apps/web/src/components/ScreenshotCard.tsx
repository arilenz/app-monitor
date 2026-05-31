import { useState } from "react";
import { apiUrl } from "../config";
import { formatDateTime } from "../lib/format";
import type { Screenshot } from "../types";
import { ScreenshotModal } from "./ScreenshotModal";
import { StatusBadge } from "./StatusBadge";

const placeholderText = (screenshot: Screenshot): string => {
  if (screenshot.status === "failed") return screenshot.error ?? "Capture failed";
  if (screenshot.status === "processing") return "Capturing…";
  return "No image yet";
};

interface ScreenshotCardProps {
  screenshot: Screenshot;
}

export const ScreenshotCard = (props: ScreenshotCardProps) => {
  const screenshot = props.screenshot;
  const [imageFailed, setImageFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = screenshot.imagePath ? apiUrl(screenshot.imagePath) : undefined;
  const showImage = screenshot.status === "complete" && Boolean(imageUrl) && !imageFailed;
  const caption = `Listing captured ${formatDateTime(screenshot.createdAt)}`;

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <time className="text-sm font-medium text-gray-700">
          {formatDateTime(screenshot.createdAt)}
        </time>
        <StatusBadge status={screenshot.status} />
      </div>

      <div className="flex aspect-3/4 items-center justify-center bg-gray-50 p-2">
        {showImage && imageUrl ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="View full screenshot"
            className="h-full w-full cursor-zoom-in"
          >
            <img
              src={imageUrl}
              alt={caption}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-contain"
            />
          </button>
        ) : (
          <p className="px-4 text-center text-sm text-gray-400">
            {placeholderText(screenshot)}
          </p>
        )}
      </div>

      {isOpen && imageUrl && (
        <ScreenshotModal src={imageUrl} caption={caption} onClose={() => setIsOpen(false)} />
      )}
    </li>
  );
};
