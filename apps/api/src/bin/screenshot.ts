#!/usr/bin/env ts-node
import { detectStore } from "../lib/stores";
import { BrowserScreenshotService } from "../services/browser-screenshot.service";

/**
 * Usage:
 *   npm run screenshot -- "<store-url>" [--hl=<lang>] [--gl=<country>]
 *
 * Examples:
 *   npm run screenshot -- "https://play.google.com/store/apps/details?id=com.whatsapp"
 *   npm run screenshot -- "https://apps.apple.com/us/app/whatsapp-messenger/id310633997" --gl=DE --hl=de
 *
 *   --hl  Interface language (e.g. de, ja).
 *   --gl  Store country/region (e.g. DE, JP).
 */
const parseFlag = (args: string[], name: string): string | undefined => {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || undefined;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const url = args.find((arg) => !arg.startsWith("--"));
  const hl = parseFlag(args, "hl");
  const gl = parseFlag(args, "gl");

  const store = url ? detectStore(url) : null;
  if (!url || !store) {
    console.error(
      'Usage: npm run screenshot -- "<store-url>" [--hl=<lang>] [--gl=<country>]\n' +
        "URL must be a Google Play or App Store app listing.",
    );
    process.exit(1);
  }

  const appId = store.extractAppId(url);
  const listingUrl = store.buildListingUrl({ url, appId: appId ?? "", hl, gl });
  const locale = [gl, hl].filter(Boolean).join("/");
  const fileName = `${store.id}-${appId ?? "page"}-${Date.now()}.png`;

  console.log(`Capturing ${store.label} listing: ${listingUrl}${locale ? ` (${locale})` : ""}`);
  const service = new BrowserScreenshotService();
  const filePath = await service.captureAndSave(listingUrl, fileName);
  console.log(`Saved screenshot to: ${filePath}`);
};

main().catch((error) => {
  console.error("Failed to capture screenshot:", error);
  process.exit(1);
});
