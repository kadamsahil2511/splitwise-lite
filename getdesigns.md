# SplitWise Lite visual reference

This file was requested as a design input. No existing `getdesigns.md` was present in the project, so these are the applied rules for the first UI and for future screens.

## Feel

Friendly and orderly, with financial clarity. Keep the visual language closer to a modern personal workspace than a banking dashboard. Use one clear action per screen and give balances room to breathe.

## Design tokens

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#f7f8f5` | Page background |
| Surface | `#ffffff` | Cards and forms |
| Ink | `#20332d` | Primary text |
| Muted | `#81978a` | Supporting text |
| Primary | `#2f9363` | Action, positive balance |
| Primary wash | `#e4f3e8` | Soft emphasis |
| Debt | `#b44545` | Negative balance and errors |
| Border | `#e7ede6` | Card and input outlines |

Headings use Manrope with a strong but compact weight. Body and controls use DM Sans. Use 8–18px corner radii, subtle borders, and restrained shadows. Keep a consistent 8px spacing rhythm. Display money with the ₹ symbol, two decimal places, and an explicit `owes` or `gets back` label.

## Layout and components

- Desktop: 250px sidebar, slim top bar, content at a readable maximum width.
- Mobile: hide the sidebar behind a labeled menu button; stack cards and actions.
- Cards: title, one primary fact, and one obvious action. No visual chart unless it answers a real decision.
- Forms: visible labels, concise helper text, required validation, clear disabled and saving states.
- Empty states: explain the next action, never show fake financial data.
- History: distinguish Expense and Settlement with text and icon; show date and amount consistently.
- Motion: brief hover and focus feedback only. Honor reduced-motion settings when adding animation.

## Screen details for the next phase

- Group details: show a summary row, member balances with green/red text labels, recent activity, and Add Expense.
- Add Expense: keep amount and payer prominent; display participant checkboxes with Select all only if needed.
- Settle Up: write each suggestion as “Bharat pays Asha ₹100.00” with a single Mark Paid action. Confirm that recording is virtual.
- History: newest first, with explicit payer/participants or sender/recipient descriptions.
