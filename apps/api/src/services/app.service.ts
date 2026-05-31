import { Error as MongooseError, isValidObjectId } from "mongoose";
import { badRequest, conflict, notFound } from "../lib/http-error";
import { extractAppId, isPlayStoreAppUrl } from "../lib/play-store";
import { AppModel, type AppDocument } from "../models/app.model";
import { ScreenshotModel } from "../models/screenshot.model";
import type { CreateAppInput } from "../types";

const MONGO_DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === MONGO_DUPLICATE_KEY;

const optionalString = (value: unknown): string | undefined => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
};

export class AppService {
  async create(input: CreateAppInput): Promise<AppDocument> {
    const url = optionalString(input?.url);
    if (!url || !isPlayStoreAppUrl(url)) {
      throw badRequest(
        "`url` must be a valid Google Play app URL " +
          "(https://play.google.com/store/apps/details?id=...)",
      );
    }

    const appId = extractAppId(url);
    if (!appId) throw badRequest("Could not extract an app id from the provided URL");

    const hl = optionalString(input.hl);
    const gl = optionalString(input.gl);

    // Deterministic guard against tracking the same app+locale twice. The
    // unique index is the backstop for concurrent inserts, but it builds
    // asynchronously, so we can't rely on it alone. (`?? null` matches missing
    // fields, which Mongo treats as null in the index.)
    const alreadyTracked = await AppModel.exists({
      appId,
      hl: hl ?? null,
      gl: gl ?? null,
    }).exec();
    if (alreadyTracked) {
      throw conflict("This app is already being tracked for the given locale");
    }

    try {
      // Capture is intentionally NOT triggered here yet — apps are only stored
      // for now. Screenshot collection will be wired in a later step.
      return await AppModel.create({ url, appId, name: optionalString(input.name), hl, gl });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflict("This app is already being tracked for the given locale");
      }
      // Enum (hl/gl) and other schema violations surface as 400, not 500.
      if (error instanceof MongooseError.ValidationError) {
        throw badRequest(error.message);
      }
      throw error;
    }
  }

  list(): Promise<AppDocument[]> {
    return AppModel.find().sort({ createdAt: -1 }).exec();
  }

  async getById(id: string): Promise<AppDocument> {
    this.requireValidId(id);
    const app = await AppModel.findById(id).exec();
    if (!app) throw notFound(`App not found: ${id}`);
    return app;
  }

  async delete(id: string): Promise<void> {
    this.requireValidId(id);
    const deleted = await AppModel.findByIdAndDelete(id).exec();
    if (!deleted) throw notFound(`App not found: ${id}`);
    // Cascade: remove the app's screenshots so none are orphaned.
    await ScreenshotModel.deleteMany({ app: id }).exec();
  }

  private requireValidId(id: string): void {
    if (!isValidObjectId(id)) throw badRequest(`Invalid app id: ${id}`);
  }
}

export const appService = new AppService();
