import { STORE_LABELS } from "../constants";
import type { Store } from "../types";

const STYLES: Record<Store, string> = {
  play: "bg-emerald-100 text-emerald-800",
  app_store: "bg-sky-100 text-sky-800",
};

interface StoreBadgeProps {
  store: Store;
}

export const StoreBadge = (props: StoreBadgeProps) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[props.store]}`}
  >
    {STORE_LABELS[props.store]}
  </span>
);
