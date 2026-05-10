# Email Spam Detector

A forensic-themed email spam detection app that analyzes emails for spam, phishing, and malicious patterns using a multi-layer rule-based ML engine.

## Getting Started

### On Replit
All three services start automatically — just open the project and it runs. No setup needed.

### On your own machine (Windows / Linux / macOS)

**Prerequisites:**
- [Node.js 24+](https://nodejs.org/en/download) — download and install
- pnpm — after Node.js is installed, run:
  ```bash
  npm install -g pnpm
  ```

**Steps:**

1. Clone or download the project folder
2. Open a terminal inside the project folder and install dependencies:
   ```bash
   pnpm install
   ```
3. Open **two separate terminals** and run one command in each:

   **Terminal 1 — API Server:**
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```
   Wait until you see: `Server listening port: 8080`

   **Terminal 2 — Frontend:**
   ```bash
   pnpm --filter @workspace/spam-detector run dev
   ```
   Wait until you see a `localhost` URL (e.g. `http://localhost:5173`)

4. Open the `localhost` URL from Terminal 2 in your browser — the app is ready.

> No database, no environment variables, no extra configuration needed.

---

## Run & Operate (Reference)

| Service | Command | Port |
|---|---|---|
| API Server | `pnpm --filter @workspace/api-server run dev` | 8080 |
| Frontend | `pnpm --filter @workspace/spam-detector run dev` | auto |

Other useful commands:
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **API:** Express 5, Pino logger, esbuild (ESM bundle)
- **Frontend:** React 18 + Vite, Tailwind CSS 4, shadcn/ui, React Query
- **Validation:** Zod (v4), drizzle-zod
- **API contract:** OpenAPI 3.1 → Orval codegen (hooks + Zod schemas)

## Where things live

```
artifacts/
  api-server/src/
    lib/spam-detector.ts   ← core detection engine (all ML logic here)
    routes/spam.ts         ← POST /api/analyze-spam endpoint
    routes/index.ts        ← route registration
  spam-detector/src/
    pages/home.tsx                          ← main page
    components/spam-detector/
      analysis-form.tsx                     ← input form (with file picker)
      results-panel.tsx                     ← verdict + export buttons
      history-panel.tsx                     ← local history flyout
    hooks/use-history.ts                    ← localStorage history state
    lib/export-utils.ts                     ← CSV / TXT / HTML / PDF export
lib/
  api-spec/openapi.yaml       ← source-of-truth API contract
  api-client-react/           ← generated hooks (useAnalyzeSpam)
  api-schemas/                ← generated Zod schemas
```

## Architecture decisions

- **No database** — analysis is pure stateless computation; history lives in localStorage (up to 20 items).
- **Contract-first API** — OpenAPI spec is the source of truth; never edit generated files in `lib/api-client-react` or `lib/api-schemas` by hand, always re-run codegen.
- **Rule-based weighted ML** — uses 150+ weighted phrases across 6 threat categories + structural signals (obfuscation, brand spoofing, URL patterns, sender reputation). No external ML service needed.
- **Pino logger** — never use `console.log/error` in server code; use `req.log` in route handlers and the singleton `logger` elsewhere.
- **Express 5 pattern** — never `return res.json()`; always `res.json(...); return;`.

## Product

- Paste or type an email (sender, subject, body, attachments) and get an instant forensic verdict: SPAM or CLEAN with a confidence score and threat score out of 100.
- Detailed breakdown: flagged keywords, phishing patterns, structural anomalies, suspicious attachments, sender reputation issues.
- Export results as CSV, TXT, HTML, or PDF.
- Full local history with per-item delete and clear-all (with confirmation dialogs).
- Attachment metadata field supports both manual entry and a file picker (reads filenames only, not file contents).

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code.
- The API server rebuilds on every workflow restart (`dev` = build + start). Changes to `spam-detector.ts` require restarting the API Server workflow.
- `spam_score` is returned as an integer 0–100 (multiplied by 100 before returning from `analyzeSpam`).
