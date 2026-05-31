export type ScreenshotStatus = "pending" | "processing" | "complete" | "failed";

export type Store = "play" | "app_store";

export interface App {
  _id: string;
  store: Store;
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
