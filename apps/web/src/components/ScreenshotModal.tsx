import { useEffect } from "react";

interface ScreenshotModalProps {
  src: string;
  caption: string;
  onClose: () => void;
}

export const ScreenshotModal = (props: ScreenshotModalProps) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 sm:p-8"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <span className="text-sm font-medium text-gray-700">{props.caption}</span>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            className="rounded-md px-2 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Captures are full-page (very tall) — scroll vertically. */}
        <div className="overflow-y-auto">
          <img src={props.src} alt={props.caption} className="w-full" />
        </div>
      </div>
    </div>
  );
};
