import { Store } from "../types";

export interface ListingParams {
  /** The original URL the user provided. */
  url: string;
  /** The store app id extracted from that URL. */
  appId: string;
  /** Interface language (e.g. "en", "de"). */
  hl?: string;
  /** Store country/region (e.g. "US", "DE"). */
  gl?: string;
}

/**
 * A store adapter knows how to recognise its URLs, pull the app id out of
 * them, and build a locale‑specific listing URL to capture. Adding a new store
 * is just another adapter in the registry below.
 */
export interface StoreAdapter {
  id: Store;
  label: string;
  matches(url: string): boolean;
  extractAppId(url: string): string | null;
  buildListingUrl(params: ListingParams): string;
}

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const playStore: StoreAdapter = {
  id: Store.Play,
  label: "Google Play",
  matches(url) {
    const parsed = parseUrl(url);
    return (
      parsed?.hostname === "play.google.com" &&
      parsed.pathname.startsWith("/store/apps/details") &&
      parsed.searchParams.get("id") !== null
    );
  },
  extractAppId(url) {
    return parseUrl(url)?.searchParams.get("id") ?? null;
  },
  // Play encodes locale as query params on the listing URL.
  buildListingUrl({ url, hl, gl }) {
    const parsed = new URL(url);
    if (hl) parsed.searchParams.set("hl", hl);
    if (gl) parsed.searchParams.set("gl", gl);
    return parsed.toString();
  },
};

// Apple App Store ids look like ".../id324684580".
const APP_STORE_ID = /\/id(\d+)/;

const appStore: StoreAdapter = {
  id: Store.AppStore,
  label: "App Store",
  matches(url) {
    const parsed = parseUrl(url);
    return parsed?.hostname === "apps.apple.com" && APP_STORE_ID.test(parsed.pathname);
  },
  extractAppId(url) {
    return parseUrl(url)?.pathname.match(APP_STORE_ID)?.[1] ?? null;
  },
  // The App Store storefront — and therefore the listing's language — is
  // determined entirely by the country in the path. We deliberately do NOT add
  // an `?l=` language param: it overrides the storefront language (forcing e.g.
  // English onto a German listing), which is not what tracking a country wants.
  buildListingUrl({ appId, gl }) {
    const country = (gl ?? "us").toLowerCase();
    return `https://apps.apple.com/${country}/app/id${appId}`;
  },
};

const ADAPTERS: readonly StoreAdapter[] = [playStore, appStore];

/** Returns the adapter that recognises the URL, or null if none do. */
export const detectStore = (url: string): StoreAdapter | null =>
  ADAPTERS.find((adapter) => adapter.matches(url)) ?? null;

/** Returns the adapter for a stored store id. */
export const getStore = (id: string): StoreAdapter => {
  const adapter = ADAPTERS.find((candidate) => candidate.id === id);
  if (!adapter) throw new Error(`Unknown store: ${id}`);
  return adapter;
};
