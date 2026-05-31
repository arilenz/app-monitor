#!/usr/bin/env ts-node
import { PlayStoreScreenshotService } from "../services/play-store-screenshot.service";

/**
 * Usage:
 *   npm run screenshot -- "<play-store-url>" [--hl=<lang>] [--gl=<country>]
 *
 * Examples:
 *   npm run screenshot -- "https://play.google.com/store/apps/details?id=com.whatsapp"
 *   npm run screenshot -- "https://play.google.com/store/apps/details?id=com.whatsapp" --hl=de --gl=DE
 *
 *   --hl  Interface language only (e.g. de, ja). Does not change the store country.
 *   --gl  Store country/region (e.g. DE, JP). Does not change your apparent IP geo.
 */
function parseFlag(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length) || undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const url = args.find((arg) => !arg.startsWith("--"));
  const hl = parseFlag(args, "hl");
  const gl = parseFlag(args, "gl");

  if (!url) {
    console.error(
      'Usage: npm run screenshot -- "<play-store-url>" [--hl=<lang>] [--gl=<country>]\n' +
        'Example: npm run screenshot -- "https://play.google.com/store/apps/details?id=com.whatsapp" --hl=de --gl=DE',
    );
    process.exit(1);
  }

  const service = new PlayStoreScreenshotService({ hl, gl });

  const locale = [gl, hl].filter(Boolean).join("/");
  console.log(
    `Capturing full-page screenshot of: ${url}${locale ? ` (locale: ${locale})` : ""}`,
  );
  const filePath = await service.captureAndSave(url);
  console.log(`Saved screenshot to: ${filePath}`);
}

main().catch((error) => {
  console.error("Failed to capture screenshot:", error);
  process.exit(1);
});
