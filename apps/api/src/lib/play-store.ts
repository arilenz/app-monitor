const PLAY_STORE_HOST = "play.google.com";
const APP_DETAILS_PATH = "/store/apps/details";

/** Extracts the Play Store app id (the `id` query param) from a listing URL. */
export const extractAppId = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get("id");
  } catch {
    return null;
  }
};

/** True when the URL is a Google Play app listing page with an `id` param. */
export const isPlayStoreAppUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === PLAY_STORE_HOST &&
      parsed.pathname.startsWith(APP_DETAILS_PATH) &&
      parsed.searchParams.get("id") !== null
    );
  } catch {
    return false;
  }
};
