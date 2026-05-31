import { Router } from "express";
import { appRouter } from "./app.routes";

export const apiRouter = Router();

apiRouter.use("/apps", appRouter);
