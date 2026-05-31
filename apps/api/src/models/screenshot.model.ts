import { Schema, model, type InferSchemaType } from "mongoose";
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
  },
  { timestamps: true },
);

export type ScreenshotDocument = InferSchemaType<typeof screenshotSchema>;
export const ScreenshotModel = model("Screenshot", screenshotSchema);
