import { Types } from "mongoose";
import { env } from "../lib/env";
import { AppModel } from "../models/app.model";
import { ScreenshotModel, type ScreenshotDocument } from "../models/screenshot.model";
import { ScreenshotStatus } from "../types";

export class ScreenshotQueueService {
  /** Inserts a pending screenshot job for a single app. */
  async enqueueForApp(appId: string | Types.ObjectId): Promise<ScreenshotDocument> {
    return ScreenshotModel.create({ app: appId, status: ScreenshotStatus.Pending });
  }

  /**
   * Inserts a pending screenshot job for every tracked app (the daily run).
   * Returns the number of jobs enqueued.
   */
  async enqueueForAllApps(): Promise<number> {
    const apps = await AppModel.find({}, { _id: 1 }).lean().exec();
    if (apps.length === 0) return 0;

    const jobs = apps.map((app) => ({ app: app._id, status: ScreenshotStatus.Pending }));
    const created = await ScreenshotModel.insertMany(jobs);
    return created.length;
  }

  /**
   * Atomically claims the oldest pending job for a worker, flipping it to
   * `processing`. Returns null when the queue is empty. Two workers can never
   * claim the same job.
   */
  async claimNext(workerId: string): Promise<ScreenshotDocument | null> {
    return ScreenshotModel.findOneAndUpdate(
      { status: ScreenshotStatus.Pending },
      {
        $set: {
          status: ScreenshotStatus.Processing,
          lockedAt: new Date(),
          lockedBy: workerId,
        },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true },
    ).exec();
  }

  /** Marks a claimed job complete and records the stored image path. */
  async complete(id: Types.ObjectId, imagePath: string): Promise<void> {
    await ScreenshotModel.updateOne(
      { _id: id },
      {
        $set: { status: ScreenshotStatus.Complete, imagePath, capturedAt: new Date() },
        $unset: { lockedAt: "", lockedBy: "" },
      },
    ).exec();
  }

  /**
   * Records a failed attempt: requeues to `pending` while attempts remain,
   * otherwise marks the job permanently `failed`.
   */
  async fail(job: ScreenshotDocument, reason: string): Promise<void> {
    const exhausted = (job.attempts ?? 0) >= env.worker.maxAttempts;
    await ScreenshotModel.updateOne(
      { _id: job._id },
      {
        $set: { status: exhausted ? ScreenshotStatus.Failed : ScreenshotStatus.Pending, error: reason },
        $unset: { lockedAt: "", lockedBy: "" },
      },
    ).exec();
  }

  /**
   * Releases jobs whose worker died mid-capture: any `processing` job whose
   * lock is older than the lease goes back to `pending`. Returns the count.
   */
  async recoverStale(leaseMs: number = env.worker.leaseMs): Promise<number> {
    const cutoff = new Date(Date.now() - leaseMs);
    const result = await ScreenshotModel.updateMany(
      { status: ScreenshotStatus.Processing, lockedAt: { $lt: cutoff } },
      { $set: { status: ScreenshotStatus.Pending }, $unset: { lockedAt: "", lockedBy: "" } },
    ).exec();
    return result.modifiedCount;
  }
}

export const screenshotQueueService = new ScreenshotQueueService();
