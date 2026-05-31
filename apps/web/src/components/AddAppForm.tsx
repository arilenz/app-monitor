import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS } from "../constants";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryClient";

const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "US";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export const AddAppForm = () => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [hl, setHl] = useState(DEFAULT_LANGUAGE);
  const [gl, setGl] = useState(DEFAULT_COUNTRY);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.createApp,
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: queryKeys.apps });
    },
  });

  const reset = () => {
    setUrl("");
    setName("");
    setHl(DEFAULT_LANGUAGE);
    setGl(DEFAULT_COUNTRY);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({
      url: url.trim(),
      name: name.trim() || undefined,
      hl: hl || undefined,
      gl: gl || undefined,
    });
  };

  const error = mutation.error
    ? mutation.error instanceof Error
      ? mutation.error.message
      : "Failed to add app"
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Track a new app</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Store URL <span className="text-red-500">*</span>
          </span>
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Google Play or App Store listing URL"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-gray-400">
            e.g. https://play.google.com/store/apps/details?id=… or
            https://apps.apple.com/…/id…
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My competitor"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Language</span>
            <select
              value={hl}
              onChange={(event) => setHl(event.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Country</span>
            <select
              value={gl}
              onChange={(event) => setGl(event.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Adding…" : "Add app"}
      </button>
    </form>
  );
};
