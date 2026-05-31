#!/usr/bin/env ts-node
import http from "node:http";
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { env } from "../config";
import { captureService } from "../services/capture.service";
import { screenshotQueueService } from "../services/screenshot-queue.service";

const sleep = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

/**
 * Cloud Run requires every container to answer health checks on $PORT, but the
 * worker is a self-driving poller with no HTTP surface. When PORT is set (i.e.
 * on Cloud Run) we expose a minimal liveness endpoint; locally PORT is unset so
 * this is skipped and the worker won't collide with the API's port.
 */
const startHealthServer = (): http.Server | null => {
  const port = process.env.PORT;
  if (!port) return null;

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  });
  server.listen(Number(port), () => console.log(`Health endpoint on :${port}`));
  return server;
};

let running = true;

/** One concurrent processing lane: drain jobs, idle when the queue is empty. */
const runLane = async (): Promise<void> => {
  while (running) {
    try {
      const processed = await captureService.processNext(env.worker.id);
      await sleep(processed ? env.worker.paceMs : env.worker.idleMs);
    } catch (error) {
      console.error("Lane error:", error);
      await sleep(env.worker.idleMs);
    }
  }
};

const startStaleSweeper = (): NodeJS.Timeout =>
  setInterval(
    () => {
      screenshotQueueService
        .recoverStale()
        .then(
          (count) =>
            count > 0 && console.log(`Recovered ${count} stale job(s)`),
        )
        .catch((error) => console.error("Stale recovery error:", error));
    },
    Math.max(env.worker.leaseMs / 2, 10_000),
  );

const main = async (): Promise<void> => {
  await connectToDatabase();
  console.log(
    `Worker ${env.worker.id} started (concurrency=${env.worker.concurrency}, lease=${env.worker.leaseMs}ms)`,
  );

  // Recover stale records
  const sweeper = startStaleSweeper();
  const healthServer = startHealthServer();

  const shutdown = () => {
    if (!running) return;
    console.log("Shutting down worker…");
    running = false;
    clearInterval(sweeper);
    healthServer?.close();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Run parallel lanes with a set concurrency
  const lanes = Array.from({ length: env.worker.concurrency }, runLane);
  await Promise.all(lanes);

  await disconnectFromDatabase();
  console.log("Worker stopped");
};

main().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
