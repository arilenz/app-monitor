# App Monitor

Track competitors' Google Play and Apple App Store listings and capture
full‑page screenshots of each listing on a timeline over time.

## How the stack works

```
                         ┌──────────────────────────────┐
                         │  Web — React SPA             │
                         └───────────────┬──────────────┘
                                         │ REST + image requests
                                         ▼
                         ┌──────────────────────────────┐
                         │  API — Express               │
                         │  • REST: manage apps         │
                         │  • serves captured images    │
                         │  • on create → enqueue job   │
                         └───────────────┬──────────────┘
                                         │ read / write
                         ┌───────────────▼──────────────┐
                         │  MongoDB                     │
                         │   apps         (tracked apps)│
                         │   screenshots  (= job queue) │
                         └──────▲─────────────────┬─────┘
                  claim pending │                 │ insert pending
                   (atomic)     │                 │ (one per app)
              ┌─────────────────┴───┐      ┌──────┴───────────────────────┐
              │  Worker(s)          │      │  Daily enqueue               │
              │  • N parallel lanes │      │  • scheduled job that adds   │
              │  • Playwright shot  │      │    a capture for every app   │
              │  • save → storage   │      └──────────────────────────────┘
              │  • update record    │
              └──────┬──────────────┘
                     │ capture → save image
                     ▼
        ┌─────────────────────────┐  ┌────────────────────────┐
        │ Google Play / App Store │  │ Image storage          │
        └─────────────────────────┘  └────────────────────────┘
```

The `screenshots` collection **is** the job queue — a record with
`status: "pending"` is a job. It's filled two ways: adding an app enqueues its
first capture, and the daily `enqueue-daily` script enqueues one per app.
Worker(s) atomically claim pending jobs, screenshot the listing with Playwright,
save the image, and mark the record `complete`/`failed`. Run more workers to
scale.

## Running the stack

Prerequisites: Node 20+ and MongoDB running on `mongodb://127.0.0.1:27017`.

Install everything (both apps + the Playwright browser) from the repo root:

```bash
npm run install:all
```

Then start each process in its own terminal (from the repo root):

```bash
npm run api      # API  → http://localhost:3000
npm run worker   # capture worker (run more to scale)
npm run web      # web  → http://localhost:5173
```

Open http://localhost:5173 and add an app.

Daily capture is a script (no endpoint) — run it manually or from cron:

```bash
npm run enqueue-daily
```

```cron
# crontab -e — daily at 03:00
0 3 * * * cd /Users/artemk/mine/app-monitor && /usr/local/bin/npm run enqueue-daily
```
