import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { ScreenshotStatus } from "../types";

const screenshotSchema = new Schema(
  {
    /** The tracked app this screenshot belongs to. */
    app: { type: Schema.Types.ObjectId, ref: "App", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ScreenshotStatus),
      default: ScreenshotStatus.Pending,
      required: true,
    },
    /** Path/URL to the captured image, set once the capture completes. */
    imagePath: { type: String },
    /** Failure reason, set when status is "failed". */
    error: { type: String },
    /** When the capture actually ran (distinct from createdAt). */
    capturedAt: { type: Date },
    /** Number of times a worker has claimed this job (for retry limits). */
    attempts: { type: Number, default: 0 },
    /** When the current worker claimed the job (drives stale-lock recovery). */
    lockedAt: { type: Date },
    /** Identifier of the worker currently holding the job. */
    lockedBy: { type: String },
  },
  { timestamps: true },
);

// Supports the atomic claim: find the oldest pending job efficiently.
screenshotSchema.index({ status: 1, createdAt: 1 });

export type ScreenshotProps = InferSchemaType<typeof screenshotSchema>;
export type ScreenshotDocument = HydratedDocument<ScreenshotProps>;
export const ScreenshotModel = model("Screenshot", screenshotSchema);
