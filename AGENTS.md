# Agent instructions

Read the [BRD](https://app.notion.com/p/406639f172f180d39927ce6830044200) and [design.md](design.md) before changing product behavior. The implementation status and deployment handoff in README are the source of truth for what currently works.

- Preserve the existing root `index.html` and `style.css`; they contain earlier collaboration work. The app entry point is `frontend/index.html`.
- Use the BRD stack: React/Vite/Tailwind, Express, PostgreSQL, Drizzle, REST/JSON.
- Store money as integer paise. Never use floating point arithmetic for balances, shares, or settlements.
- Keep expenses and settlements immutable after creation. Derive balances from ledger records.
- Validate request bodies and group membership on the server. Return useful 400/404 responses.
- Equal shares must total the original amount exactly; allocate leftover paise by sorted participant ID.
- Settlement recording must check the current suggested amount for the exact pair inside a transaction.
- Save expenses and their shares in one database transaction.
- Keep forms labeled, keyboard usable, and responsive. Show loading and error states.
- Add a focused test for money and settlement logic before implementing it. Run `npm test` and `npm run build` before reporting completion.
- Do not add login, transfers, multi-currency, unequal splits, or editing for v1.
