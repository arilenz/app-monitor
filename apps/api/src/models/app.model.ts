import { Schema, model, type InferSchemaType } from "mongoose";
import { Country, Language, Store } from "../types";

const appSchema = new Schema(
  {
    /** Which app store this listing belongs to. */
    store: { type: String, enum: Object.values(Store), required: true },
    /** Full store listing URL as provided by the user. */
    url: { type: String, required: true },
    /** The store app id (Play package name or App Store numeric id). */
    appId: { type: String, required: true, index: true },
    name: { type: String },
    /** Interface language (`hl` query param). */
    hl: { type: String, enum: Object.values(Language) },
    /** Store country/region (`gl` query param). */
    gl: { type: String, enum: Object.values(Country) },
  },
  { timestamps: true },
);

// Prevent tracking the same app (per store) for the same locale twice.
appSchema.index({ store: 1, appId: 1, hl: 1, gl: 1 }, { unique: true });

export type AppDocument = InferSchemaType<typeof appSchema>;
export const AppModel = model("App", appSchema);
