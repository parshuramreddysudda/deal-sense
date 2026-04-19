# DealSense — Deployment

This project is a single Vercel deployment:

- **Frontend**: Vite + React build, served as static assets from `frontend/dist`.
- **API**: Vercel serverless functions under `api/*.js` (`/api/analyse`, `/api/market-data`).
- **PDF export**: runs entirely in the browser via `jsPDF` — no backend render, no Chromium.
- **Local dev**: `backend/index.js` is a thin Express wrapper that mounts the **same** handlers from `api/_lib/handlers.js`, so there is one source of truth.

## Architecture

```
deal-sense/
├── api/                       Vercel serverless functions (production)
│   ├── _lib/handlers.js       Shared scoring engine + handlers (CommonJS)
│   ├── analyse.js             POST /api/analyse
│   └── market-data.js         GET  /api/market-data
├── backend/                   Local-dev-only Express wrapper
│   ├── index.js               Imports ../api/_lib/handlers.js
│   └── package.json           (no puppeteer, no multer)
├── frontend/                  React + Vite SPA
│   ├── src/lib/pdf.ts         Client-side jsPDF brief generator
│   └── vite.config.ts         /api proxy -> http://localhost:3001 for dev
├── vercel.json                Build + function config
└── package.json
```

## Local development

```bash
npm run install:all
npm start
```

- Frontend: http://localhost:5173
- Backend (Express): http://localhost:3001
- Vite proxies `/api/*` to the backend, so the **same relative URLs** used in production also work locally.

## Deploying to Vercel

### One-time setup

```bash
npm i -g vercel
vercel login
```

### First deploy

From the repo root:

```bash
vercel
```

When prompted:

- **Set up and deploy?** Yes
- **Scope** your personal / team account
- **Link to existing project?** No
- **Project name** `deal-sense` (or whatever you like)
- **In which directory is your code?** `./` (the repo root)
- **Override settings?** No (Vercel reads `vercel.json`)

Vercel will:

1. Run `npm install` at the root.
2. Run the build: `cd frontend && npm install && npm run build`.
3. Publish `frontend/dist` as the static site.
4. Auto-detect `api/*.js` and deploy each as a Node.js serverless function (with the limits declared in `vercel.json`: 256MB memory, 10s timeout — well within Hobby tier).

Each subsequent deploy:

```bash
vercel          # preview deploy
vercel --prod   # production
```

Or connect the GitHub repo in the Vercel dashboard and it will auto-deploy on every push.

## Why no Puppeteer?

Puppeteer bundles a full Chromium (~300MB) which:

- Does **not** fit in Vercel Hobby's 50MB serverless function limit.
- Even on Pro (250MB), cold-starts are painfully slow.

We replaced the server-rendered PDF with `jsPDF` on the client, which:

- Adds ~100KB to the SPA bundle (already shipped to the browser anyway).
- Works offline — even when the scoring API is unreachable.
- Eliminates the `/api/export-pdf` round-trip entirely.

## Hobby-tier limits to keep in mind

| Limit               | Hobby           | Current headroom                       |
| ------------------- | --------------- | -------------------------------------- |
| Function bundle     | 50 MB           | API is ~30 KB of pure JS, essentially free |
| Function timeout    | 10 s (default)  | `analyse` completes in <500 ms         |
| Monthly bandwidth   | 100 GB          | Report payloads are small JSON         |
| Concurrent requests | shared pool     | Fine for demo traffic                  |

## Environment variables

None required. If you later add API keys (e.g. for a real market-data source), set them in **Project Settings → Environment Variables** on Vercel and read them via `process.env.XXX` inside `api/*.js`.
