import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Storage } from "@google-cloud/storage";
import { env } from "../config";

/**
 * Persists captured screenshot images. `save` returns the public path/URL that
 * gets stored on the Screenshot record and rendered by the frontend.
 * The driver is selected at startup (see {@link createScreenshotStorage}).
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

/**
 * Uploads to a Cloud Storage bucket and returns the public object URL. The
 * bucket is expected to grant public read (see the Terraform config), so the
 * URL can be rendered directly by the frontend without signing.
 */
export class GcsStorage implements ScreenshotStorage {
  private readonly storage: Storage;

  constructor(private readonly bucket: string) {
    this.storage = new Storage();
  }

  async save(key: string, data: Buffer): Promise<string> {
    const objectKey = key.split("\\").join("/");
    await this.storage
      .bucket(this.bucket)
      .file(objectKey)
      .save(data, { contentType: "image/png" });
    return `https://storage.googleapis.com/${this.bucket}/${objectKey}`;
  }
}

const createScreenshotStorage = (): ScreenshotStorage => {
  if (env.storage.driver !== "gcs") return new LocalFileStorage();

  if (!env.storage.gcsBucket) {
    throw new Error("STORAGE_DRIVER=gcs requires GCS_BUCKET to be set");
  }
  return new GcsStorage(env.storage.gcsBucket);
};

export const screenshotStorage: ScreenshotStorage = createScreenshotStorage();

/** Builds a stable, collision-free storage key for a screenshot. */
export const buildScreenshotKey = (appId: string, screenshotId: string): string =>
  join(appId, `${screenshotId}.png`);
