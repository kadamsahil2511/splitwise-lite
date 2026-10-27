# SplitWise Lite design

Source: [Business Requirements & Implementation Plan](https://app.notion.com/p/406639f172f180d39927ce6830044200). This document turns its requirements into build decisions; it does not replace the BRD.

## Purpose and scope

A small demo workspace for students, roommates, and travel groups to record shared expenses and understand who owes whom. The completed MVP must support group and member creation, equal split expenses, balances, settlement suggestions, manual settlement records, and newest-first history. No real payments or accounts.

The current MVP implements group and member creation, expense entry, balances, suggested settlements, and history. Deployment uses Vercel for the frontend and Render for the backend, with a PostgreSQL database.

## Product flow

1. Open Overview and create a group.
2. Open the group and add members.
3. Add an expense with title, positive amount in INR, one payer, selected participants, and date.
4. Show saved expense, per-member net balances, and suggested transfers.
5. Mark one suggested transfer as paid; append settlement history and refresh balances.

## Information architecture

- **Overview:** group list and create action.
- **Group:** members, balance summary, recent expenses, and member/expense actions.
- **Add Expense:** one focused form with payer selector and participant checkboxes.
- **Settle Up:** current suggested transfers, each with a Mark Paid action.
- **History:** one chronological list for expenses and settlements, newest first.

## Visual direction

Use the concrete design rules in [getdesigns.md](getdesigns.md). The interface should feel calm, trustworthy, and light: warm off-white canvas, green highlights, simple white cards, generous spacing, and readable money values. Credit balances use green; debts use a distinct red with text labels so color is never the only signal. Avoid charts and decorative controls that imply missing functionality.

## Data and API decisions

Use the BRD's five PostgreSQL tables. UUIDs identify groups, members, expenses, shares, and settlements. Group membership is enforced by composite foreign keys for payer, shares, sender, and recipient. All write endpoints validate inputs before database writes. Expense plus shares is one transaction. Settlement validation and insert is one transaction with concurrency protection when implemented.

All money is integer paise. Equal split: sort participant IDs, divide by participant count, and give the first `amountPaise % count` IDs one additional paisa. A zero-paise share is allowed when a positive amount is split among more people than paise; the expense itself must remain positive. Net balance is paid expense amount minus owed shares plus settlements sent minus settlements received. Suggestions greedily match sorted debtors and creditors until every balance is zero. The algorithm clears balances but need not minimize transfer count.

## API contract

The BRD defines `GET/POST /api/groups`, `GET /api/groups/:id`, `POST /api/groups/:id/members`, `GET/POST /api/groups/:id/expenses`, `GET /api/groups/:id/balances`, and `GET/POST /api/groups/:id/settlements`. These endpoints are implemented. `GET /health` supports Render readiness and an external uptime bot.

## Validation and completion

The MVP is done when three members can split ₹900 and ₹300 as in the BRD, show +₹500/−₹100/−₹400, record the two suggested transfers, and return every balance to ₹0. Also test ₹100 split among three, one-person expenses, invalid or cross-group members, duplicate participants, nonpositive amounts, and an overpayment retry.
