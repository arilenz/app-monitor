import cors from "cors";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { connectToDatabase } from "./db";
import { env } from "./config";
import { HttpError } from "./lib/http-error";
import { apiRouter } from "./routes";

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Serve captured screenshot images from local storage.
  app.use(env.publicScreenshotsPath, express.static(env.screenshotsDir));

  app.use("/api", apiRouter);

  // Unmatched routes.
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler — translates HttpError into a status code and
  // treats anything else as an unexpected 500.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (statusCode >= 500) console.error(error);

    res.status(statusCode).json({ error: message });
  });

  return app;
};

const start = async (): Promise<void> => {
  await connectToDatabase();
  createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
