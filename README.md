# SplitWise Lite

A small shared expense manager based on the [BRD](https://app.notion.com/p/406639f172f180d39927ce6830044200). Create groups and members, split INR expenses equally, see balances and suggested transfers, and record virtual settlements. No real payments are made.

## Run locally

Requires Node.js 20.19+ and PostgreSQL.

1. Create a PostgreSQL database named `splitwise_lite`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` for your local database. The existing `.env`, if any, stays local and is ignored by Git.
3. Run `npm install`.
4. Run `npm run db:migrate`.
5. Run `npm run dev`, then open `http://localhost:5173`.

The frontend proxies `/api` to Express on port 3001. Run `npm test` for backend checks and `npm run build` for a production frontend build. For direct cross-origin access, set `VITE_API_URL` in `frontend/.env.local` to the backend origin (without `/api`) and `FRONTEND_ORIGIN` in the root `.env` to the frontend origin.

## Current endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/groups` | List groups |
| POST | `/api/groups` | Create group (`{ "name": "Goa trip" }`) |
| GET | `/api/groups/:id` | Group and members |
| POST | `/api/groups/:id/members` | Add member (`{ "name": "Asha" }`) |
| GET/POST | `/api/groups/:id/expenses` | Expense history and equal-split entry |
| GET | `/api/groups/:id/balances` | Member balances, group total, suggested transfers |
| GET/POST | `/api/groups/:id/settlements` | Settlement history and recorded payment |
| GET | `/health` | Database-backed health check for Render and the uptime bot |

Expenses and settlements are immutable records. Amounts and calculations use integer paise.

## Deployment handoff

The backend is live at `https://splitwise-lite-2mi4.onrender.com`. Its Render web service uses root directory `backend/`, build command `npm install --include=dev && npm run db:migrate`, start command `npm start`, and health check path `/health`. Set `DATABASE_URL` to the Render database's **internal** URL, `NODE_ENV=production`, and `FRONTEND_ORIGIN=https://splitwise.kadamsahil.com`. The root [render.yaml](render.yaml) also defines a Blueprint for a fresh deployment. An external uptime bot can GET `https://splitwise-lite-2mi4.onrender.com/health` every 10–14 minutes. [Render's free web service sleeps after 15 minutes of inactivity](https://render.com/docs/free).

For Vercel, import this repository with **Root Directory `frontend`**, **Framework Vite**, and **Build Command `npm run build`**. Set `VITE_API_URL=https://splitwise-lite-2mi4.onrender.com` (without `/api`). Connect `splitwise.kadamsahil.com` in Vercel and add the DNS record Vercel shows. The Render `FRONTEND_ORIGIN` already permits that exact domain.

**Data lifetime:** This free Render PostgreSQL database expires **November 26, 2026** and [has no backups](https://render.com/docs/free). Upgrade the database or use a persistent PostgreSQL provider before storing anything you need to keep. An uptime bot does not change this database limit.

## Project files

- `frontend/`: React, Vite, Tailwind UI.
- `backend/`: Express routes, Drizzle schema, migration, and tests.
- `AGENTS.md` / `agent.md`: guidance for coding agents.
- `design.md` / `getdesigns.md`: behavior and visual design decisions.

The original root `index.html` and `style.css` were left in place because they contain existing collaborator edits. Run the app from `frontend/` through the root scripts above.
