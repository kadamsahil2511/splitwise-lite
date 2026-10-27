# SplitWise Lite MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Complete the BRD's virtual shared-expense flow and prepare the split frontend/backend deployment.

**Architecture:** Keep React/Vite and Express in the existing workspaces. PostgreSQL/Drizzle stores immutable ledger records; one pure service computes shares, balances, and settlement suggestions. The API validates and writes records, and the group screen renders the resulting state.

**Tech Stack:** React 19, Vite 7, Tailwind 4, Express 5, PostgreSQL, Drizzle.

**Spec:** [design.md](../../../design.md) and the linked Notion BRD.

## Global constraints

- Integer paise only; split remainders by sorted participant ID.
- Expenses and settlements are immutable, and balances derive from the ledger.
- Validate group membership, positive money amounts, duplicate participants, and pair settlement limits server-side.
- Expense/share writes and settlement validation/write must be transactional.
- Preserve the collaborator's root `index.html` and `style.css` edits.
- No auth or real payments; Vercel frontend deployment stays with the user.

## Review focus

- ₹100 among three must save shares totaling ₹100 exactly.
- A payer who is not a participant still receives full credit.
- Cross-group member IDs and duplicate participants must fail with 400.
- Two concurrent or repeated settlement writes must never overpay a pair.
- A zero-balance group must show no suggested transfers.

---

### Task 1: Ledger calculations

**Files:** Create `backend/src/ledger.js`, `backend/src/ledger.test.js`.

**Interfaces:** `splitExpense(amountPaise, participantIds)` returns `{memberId, sharePaise}[]`; `calculateBalances(members, expenses, shares, settlements)` returns per-member integer balances; `suggestSettlements(balances)` returns `{fromMemberId,toMemberId,amountPaise}[]`.

- [x] Write tests for deterministic remainder, worked BRD example, one-person expense, and suggestions clearing all debts.
- [x] Run the tests and confirm they fail for missing functions.
- [x] Implement the pure functions with integer arithmetic.
- [x] Run the tests and confirm they pass.

### Task 2: Expense and balance API

**Files:** Modify `backend/src/server.js`; create `backend/src/validation.test.js` cases as needed.

- [x] Test valid expense input and invalid amount, date, payer, participants, and duplicate IDs.
- [x] Implement `GET/POST /api/groups/:id/expenses`, saving expense and shares in one transaction.
- [x] Implement `GET /api/groups/:id/balances` from saved ledger records.
- [x] Verify API behavior against a disposable PostgreSQL database.

### Task 3: Settlements and history API

**Files:** Modify `backend/src/server.js` and `backend/src/ledger.test.js`.

- [x] Test a valid partial settlement, a repeated overpayment, and a mismatched pair.
- [x] Implement `GET/POST /api/groups/:id/settlements`; lock the group row while validating and inserting a payment.
- [x] Verify history ordering and resulting balances against PostgreSQL.

### Task 4: Complete group UI

**Files:** Modify `frontend/src/App.jsx`, `frontend/src/api.js`, `frontend/src/style.css`, `getdesigns.md` only if the visual rules need refinement.

- [x] Build labeled Add Expense form and explicit loading/error feedback.
- [x] Show balance cards, suggestions, Mark Paid action, and newest-first history.
- [x] Verify the three-member BRD journey in a browser at desktop and mobile widths.

### Task 5: Deployment handoff and repository

**Files:** Modify `backend/src/server.js`, `frontend/src/api.js`, `.env.example`, `README.md`, `AGENTS.md`; create `render.yaml` and `frontend/.env.example` if needed.

- [x] Add `GET /health`, production host binding, exact frontend origin handling, and configurable frontend API URL.
- [x] Add Render service/database configuration and documented migration command, health path, uptime bot URL, Vercel root/build settings, and domain DNS handoff.
- [x] Run tests, build, migration, and production dependency audit.
- [x] Publish the finished repository under GitHub user `kadamsahil2511` without exposing `.env`; leave Vercel deployment to the user.

## Deployment state

Code and deployment configuration are pushed to GitHub. Render service creation awaits sign-in to the Render dashboard; the user will deploy the frontend on Vercel later.
