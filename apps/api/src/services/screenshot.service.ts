import { isValidObjectId } from "mongoose";
import { badRequest, notFound } from "../lib/http-error";
import { AppModel } from "../models/app.model";
import { ScreenshotModel, type ScreenshotDocument } from "../models/screenshot.model";

export class ScreenshotService {
  /**
   * Lists an app's screenshots ordered by creation time, newest first
   * (drives the monitoring timeline).
   */
  async listForApp(appId: string): Promise<ScreenshotDocument[]> {
    if (!isValidObjectId(appId)) throw badRequest(`Invalid app id: ${appId}`);

    const appExists = await AppModel.exists({ _id: appId }).exec();
    if (!appExists) throw notFound(`App not found: ${appId}`);

    return ScreenshotModel.find({ app: appId }).sort({ createdAt: -1 }).exec();
  }
}

export const screenshotService = new ScreenshotService();
