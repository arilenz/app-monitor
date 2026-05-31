import mongoose from "mongoose";
import { env } from "./lib/env";

export const connectToDatabase = async (uri: string = env.mongoUri): Promise<void> => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
};

export const disconnectFromDatabase = (): Promise<void> => mongoose.disconnect();
