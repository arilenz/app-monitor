export type ScreenshotStatus = "pending" | "complete" | "failed";

export interface App {
  _id: string;
  url: string;
  appId: string;
  name?: string;
  hl?: string;
  gl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Screenshot {
  _id: string;
  app: string;
  status: ScreenshotStatus;
  imagePath?: string;
  error?: string;
  capturedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppInput {
  url: string;
  name?: string;
  hl?: string;
  gl?: string;
}
