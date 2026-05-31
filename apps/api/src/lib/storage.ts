import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env } from "./env";

/**
 * Persists captured screenshot images. `save` returns the public path/URL that
 * gets stored on the Screenshot record and rendered by the frontend.
 * A GCS-backed implementation can be dropped in later without touching callers.
 */
export interface ScreenshotStorage {
  save(key: string, data: Buffer): Promise<string>;
}

export class LocalFileStorage implements ScreenshotStorage {
  constructor(
    private readonly baseDir: string = env.screenshotsDir,
    private readonly publicPath: string = env.publicScreenshotsPath,
  ) {}

  async save(key: string, data: Buffer): Promise<string> {
    const filePath = resolve(this.baseDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    // Forward-slash public path, independent of the OS file separator.
    return `${this.publicPath}/${key.split("\\").join("/")}`;
  }
}

export const screenshotStorage: ScreenshotStorage = new LocalFileStorage();

/** Builds a stable, collision-free storage key for a screenshot. */
export const buildScreenshotKey = (appId: string, screenshotId: string): string =>
  join(appId, `${screenshotId}.png`);
