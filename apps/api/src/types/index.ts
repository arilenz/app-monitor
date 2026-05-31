export enum ScreenshotStatus {
  Pending = "pending",
  Complete = "complete",
  Failed = "failed",
}

/**
 * Interface language for the Play Store listing (`hl` query param).
 * A pragmatic subset of Google Play's supported UI languages — extend as needed.
 */
export enum Language {
  English = "en",
  German = "de",
  French = "fr",
  Spanish = "es",
  Italian = "it",
  Portuguese = "pt",
  Dutch = "nl",
  Russian = "ru",
  Japanese = "ja",
  Korean = "ko",
  Chinese = "zh",
  Arabic = "ar",
  Hindi = "hi",
  Turkish = "tr",
  Polish = "pl",
  Ukrainian = "uk",
  Hebrew = "he",
}

/**
 * Store country/region for the Play Store listing (`gl` query param).
 * A pragmatic subset of Google Play's supported countries — extend as needed.
 */
export enum Country {
  UnitedStates = "US",
  UnitedKingdom = "GB",
  Canada = "CA",
  Australia = "AU",
  Germany = "DE",
  France = "FR",
  Spain = "ES",
  Italy = "IT",
  Netherlands = "NL",
  Brazil = "BR",
  Mexico = "MX",
  Japan = "JP",
  SouthKorea = "KR",
  India = "IN",
  Russia = "RU",
  Ukraine = "UA",
  Israel = "IL",
}

/** Request body for creating a tracked app. */
export interface CreateAppInput {
  url: string;
  name?: string;
  hl?: Language;
  gl?: Country;
}
