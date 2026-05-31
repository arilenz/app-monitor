import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config();

// Project root: apps/api/src -> ../../.. -> app-monitor
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..");

const number = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: number(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/app-monitor",

  // Where captured images are written and the public path they're served under.
  screenshotsDir: process.env.SCREENSHOTS_DIR ?? resolve(PROJECT_ROOT, "screenshots"),
  publicScreenshotsPath: "/screenshots",

  storage: {
    // "local" writes to disk and serves via express.static (dev default);
    // "gcs" uploads to a Cloud Storage bucket and returns public object URLs.
    driver: process.env.STORAGE_DRIVER ?? "local",
    gcsBucket: process.env.GCS_BUCKET ?? "",
  },

  worker: {
    id: process.env.WORKER_ID ?? `worker-${process.pid}`,
    concurrency: number(process.env.WORKER_CONCURRENCY, 2),
    leaseMs: number(process.env.WORKER_LEASE_MS, 120_000),
    maxAttempts: number(process.env.WORKER_MAX_ATTEMPTS, 3),
    idleMs: number(process.env.WORKER_IDLE_MS, 2_000),
    // Polite pacing between captures to avoid hammering the Play Store.
    paceMs: number(process.env.WORKER_PACE_MS, 1_000),
  },
} as const;
