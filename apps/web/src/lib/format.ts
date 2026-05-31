export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const formatLocale = (hl?: string, gl?: string): string =>
  [gl, hl].filter(Boolean).join(" / ") || "default";
