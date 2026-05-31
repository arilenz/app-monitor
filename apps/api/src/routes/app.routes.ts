import { Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { appService } from "../services/app.service";
import { screenshotService } from "../services/screenshot.service";

export const appRouter = Router();

// Create app
appRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const app = await appService.create(req.body);
    res.status(201).json(app);
  }),
);

// Apps list
appRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const apps = await appService.list();
    res.json(apps);
  }),
);

// App details
appRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const app = await appService.getById(req.params.id);
    res.json(app);
  }),
);

// App screenshots (timeline, newest first)
appRouter.get(
  "/:id/screenshots",
  asyncHandler(async (req, res) => {
    const screenshots = await screenshotService.listForApp(req.params.id);
    res.json(screenshots);
  }),
);

// Delete app
appRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await appService.delete(req.params.id);
    res.status(204).send();
  }),
);
