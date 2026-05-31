/**
 * Origin of the API server, used for both API calls and screenshot image URLs.
 * Defaults to the local API; set VITE_API_BASE_URL to the API's URL when it
 * runs on a separate server, e.g. "https://api.example.com".
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/** Resolves an API path (e.g. "/screenshots/x.png") to an absolute URL. */
export const apiUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
