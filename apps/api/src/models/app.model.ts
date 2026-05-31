import { Schema, model, type InferSchemaType } from "mongoose";
import { Country, Language } from "../types";

const appSchema = new Schema(
  {
    /** Full Play Store listing URL as provided by the user. */
    url: { type: String, required: true },
    /** The Play Store app id (e.g. com.activision.callofduty.shooter). */
    appId: { type: String, required: true, index: true },
    name: { type: String },
    /** Interface language (`hl` query param). */
    hl: { type: String, enum: Object.values(Language) },
    /** Store country/region (`gl` query param). */
    gl: { type: String, enum: Object.values(Country) },
  },
  { timestamps: true },
);

// Prevent tracking the same app for the same locale twice.
appSchema.index({ appId: 1, hl: 1, gl: 1 }, { unique: true });

export type AppDocument = InferSchemaType<typeof appSchema>;
export const AppModel = model("App", appSchema);
