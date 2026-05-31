import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium, type Browser } from "playwright";
import { env } from "../config";

/**
 * Desktop viewport so store pages render their web layout rather than a mobile
 * fallback.
 */
const VIEWPORT = { width: 1440, height: 900 };

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface BrowserScreenshotOptions {
  /** Directory where screenshots are written. Defaults to <root>/screenshots. */
  screenshotsDir?: string;
  /** Run the browser headlessly. Defaults to true. */
  headless?: boolean;
  /** Navigation timeout in milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
}

/**
 * Captures full‑page screenshots of any web page. Store‑specific concerns
 * (which URL to capture, locale) are resolved by the caller before getting
 * here — this service just drives the browser.
 */
export class BrowserScreenshotService {
  private readonly screenshotsDir: string;
  private readonly headless: boolean;
  private readonly timeoutMs: number;

  constructor(options: BrowserScreenshotOptions = {}) {
    this.screenshotsDir = options.screenshotsDir ?? env.screenshotsDir;
    this.headless = options.headless ?? true;
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  /**
   * Navigates to a URL and captures a full‑page screenshot, returning the raw
   * PNG bytes. Persisting them is the caller's concern (see {@link saveScreenshot}).
   */
  async capturePage(url: string): Promise<Buffer> {
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless: this.headless });
      const context = await browser.newContext({ viewport: VIEWPORT, userAgent: USER_AGENT });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "networkidle", timeout: this.timeoutMs });

      return await page.screenshot({ fullPage: true, type: "png" });
    } finally {
      await browser?.close();
    }
  }

  /** Persists screenshot bytes to disk, creating the target directory if needed. */
  async saveScreenshot(image: Buffer, fileName: string): Promise<string> {
    const filePath = resolve(this.screenshotsDir, fileName);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, image);
    return filePath;
  }

  /** Convenience: capture a page and save it under the given file name. */
  async captureAndSave(url: string, fileName: string): Promise<string> {
    const image = await this.capturePage(url);
    return this.saveScreenshot(image, fileName);
  }
}
