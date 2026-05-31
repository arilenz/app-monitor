#!/usr/bin/env ts-node
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { screenshotQueueService } from "../services/screenshot-queue.service";

/**
 * Daily enqueue: inserts a pending capture job for every tracked app, then
 * exits. Designed to be run by cron locally (or a Cloud Run Job triggered by
 * Cloud Scheduler in production). Workers pick the jobs up from the queue.
 */
const main = async (): Promise<void> => {
  await connectToDatabase();
  try {
    const enqueued = await screenshotQueueService.enqueueForAllApps();
    console.log(`Enqueued ${enqueued} capture job(s)`);
  } finally {
    await disconnectFromDatabase();
  }
};

main().catch((error) => {
  console.error("Daily enqueue failed:", error);
  process.exit(1);
});
