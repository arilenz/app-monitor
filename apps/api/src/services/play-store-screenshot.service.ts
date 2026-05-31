import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium, type Browser } from "playwright";

/**
 * Project root: apps/api/src/services -> ../../../.. -> app-monitor
 */
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..", "..");
const DEFAULT_SCREENSHOTS_DIR = resolve(PROJECT_ROOT, "screenshots");

/**
 * Use a desktop viewport so the rendered Play Store page matches the web layout
 * rather than a mobile fallback.
 */
const VIEWPORT = { width: 1440, height: 900 };

export interface PlayStoreScreenshotOptions {
  /** Directory where screenshots are written. Defaults to <root>/screenshots. */
  screenshotsDir?: string;
  /** Run the browser headlessly. Defaults to true. */
  headless?: boolean;
  /** Navigation timeout in milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
  /**
   * Interface language (`hl` query param), e.g. "en", "de", "ja".
   * Changes the language of the page text only — not the store country.
   */
  hl?: string;
  /**
   * Store country/region (`gl` query param), e.g. "US", "DE", "JP".
   * Changes the store catalog (pricing, availability, region-specific data).
   * Note: this is a request hint — it does NOT change your apparent IP
   * geolocation, which still governs consent walls and bot detection.
   */
  gl?: string;
}

/**
 * Captures full-page screenshots of the Google Play Store web pages.
 */
export class PlayStoreScreenshotService {
  private readonly screenshotsDir: string;
  private readonly headless: boolean;
  private readonly timeoutMs: number;
  private readonly hl?: string;
  private readonly gl?: string;

  constructor(options: PlayStoreScreenshotOptions = {}) {
    this.screenshotsDir = options.screenshotsDir ?? DEFAULT_SCREENSHOTS_DIR;
    this.headless = options.headless ?? true;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.hl = options.hl;
    this.gl = options.gl;
  }

  /**
   * Navigates to a Play Store URL and captures a full-page screenshot.
   * Returns the raw PNG bytes — persisting them is the caller's concern
   * (see {@link saveScreenshot}).
   */
  async capturePage(url: string): Promise<Buffer> {
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless: this.headless });
      const context = await browser.newContext({
        viewport: VIEWPORT,
        // A real UA reduces the chance of being served a degraded layout.
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
      const page = await context.newPage();

      await page.goto(this.withLocale(url), {
        waitUntil: "networkidle",
        timeout: this.timeoutMs,
      });

      return await page.screenshot({ fullPage: true, type: "png" });
    } finally {
      await browser?.close();
    }
  }

  /**
   * Persists screenshot bytes to disk, creating the target directory if needed.
   * Kept independent of the capture step so it can be reused/tested on its own.
   */
  async saveScreenshot(image: Buffer, fileName: string): Promise<string> {
    const filePath = resolve(this.screenshotsDir, fileName);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, image);
    return filePath;
  }

  /**
   * Convenience orchestration: capture a page and save it to disk.
   * Returns the absolute path of the written file.
   */
  async captureAndSave(url: string): Promise<string> {
    const image = await this.capturePage(url);
    const fileName = this.buildFileName(url);
    return this.saveScreenshot(image, fileName);
  }

  /**
   * Returns the URL with the configured `hl` (language) and `gl` (country)
   * query params applied, overriding any already present. Params left
   * undefined on the service are not touched on the URL.
   */
  private withLocale(url: string): string {
    try {
      const parsed = new URL(url);
      if (this.hl) parsed.searchParams.set("hl", this.hl);
      if (this.gl) parsed.searchParams.set("gl", this.gl);
      return parsed.toString();
    } catch {
      // Leave an unparseable URL untouched; goto will surface the error.
      return url;
    }
  }

  /**
   * Builds a stable, filesystem-safe file name from the Play Store URL,
   * preferring the app `id` query param when present. The configured locale
   * (`hl`/`gl`) is folded into the name so captures of the same app across
   * languages/regions don't collide.
   */
  private buildFileName(url: string): string {
    let slug = "play-store";

    try {
      const parsed = new URL(url);
      const appId = parsed.searchParams.get("id");
      slug = appId ?? parsed.pathname.split("/").filter(Boolean).pop() ?? slug;
    } catch {
      // Fall back to the default slug on an unparseable URL.
    }

    const localeParts = [this.gl, this.hl].filter(Boolean).join("-");
    const localeSuffix = localeParts ? `-${localeParts}` : "";
    const safeSlug = `${slug}${localeSuffix}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${safeSlug}-${Date.now()}.png`;
  }
}
