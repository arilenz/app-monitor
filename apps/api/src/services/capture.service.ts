import { buildScreenshotKey, screenshotStorage, type ScreenshotStorage } from "../lib/storage";
import { getStore } from "../lib/stores";
import { AppModel } from "../models/app.model";
import { BrowserScreenshotService } from "./browser-screenshot.service";
import { screenshotQueueService, type ScreenshotQueueService } from "./screenshot-queue.service";

export class CaptureService {
  constructor(
    private readonly queue: ScreenshotQueueService = screenshotQueueService,
    private readonly storage: ScreenshotStorage = screenshotStorage,
    private readonly capturer: BrowserScreenshotService = new BrowserScreenshotService(),
  ) {}

  /**
   * Claims and processes a single pending job end to end. Returns true if a job
   * was processed, false if the queue was empty (so the caller can idle).
   */
  async processNext(workerId: string): Promise<boolean> {
    const job = await this.queue.claimNext(workerId);
    if (!job) return false;

    try {
      const app = await AppModel.findById(job.app).exec();
      if (!app) {
        // App was deleted after the job was claimed — nothing to capture.
        await this.queue.fail(job, "App no longer exists");
        return true;
      }

      const listingUrl = getStore(app.store).buildListingUrl({
        url: app.url,
        appId: app.appId,
        hl: app.hl ?? undefined,
        gl: app.gl ?? undefined,
      });
      const image = await this.capturer.capturePage(listingUrl);

      const key = buildScreenshotKey(app.appId, job._id.toString());
      const imagePath = await this.storage.save(key, image);

      await this.queue.complete(job._id, imagePath);
      console.log(`✓ captured ${app.appId} → ${imagePath}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Capture failed";
      await this.queue.fail(job, reason);
      console.error(`✗ capture failed for job ${job._id.toString()}: ${reason}`);
    }

    return true;
  }
}

export const captureService = new CaptureService();
