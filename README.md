# Dead Signal

A solo murder-mystery for phone and tablet. You solve the case by searching the
crime scene, unlocking the victim's devices and questioning suspects, then
naming **who** killed, **how** and **why**.

This repository holds the **playable prototype** of case 01, *The Last Upload*,
built as a web app (it runs in the phone's browser and can be installed to the
home screen). Photos and filmed suspect videos are placeholders for now.

## How the pieces fit together

| Tool | What it does for Dead Signal |
| --- | --- |
| **GitHub** (this repository) | Keeps the code and the full history of every change. |
| **Vercel** | Rebuilds and publishes the game automatically each time code reaches GitHub. |
| **Supabase** | Receives one anonymous record per finished game (time, mistakes, rank, "want another case?") so you can check the success metrics from the PRD. |

## Where things live

| Folder | What's inside |
| --- | --- |
| `cases/the-last-upload/case.json` | **The whole case**: rooms, hotspots, devices and their messages/emails/photos, suspects and their questions, clues, unlock rules, accusation options, endings. Edit this to change the story — no code needed. |
| `src/engine/` | The clue engine (`rules.ts`), the saved game (`store.ts`) and the case format (`types.ts`). |
| `src/components/` | The screens: crime scene, fake phone OS, interviews, evidence bag, accusation, ending. |
| `src/lib/telemetry.ts` | Sends the anonymous end-of-game record to Supabase. |
| `supabase/migrations/` | The database table for those records. |
| `tests/` | Automatic checks, including a simulated player who must be able to solve the case. |

## Editing the case

Everything in the game is unlocked by **facts**, short labels like
`clue:tea_cups` (a clue was found), `asked:n_where` (a question was asked) or
`event:twist` (the player arrested the wrong person). Anything with
`"requires": "some:fact"` stays hidden until that fact is known; a list means
"any of these". `rules` create new facts from old ones, e.g. a **Confront**
question appears when the suspect's statement *and* the clue that contradicts
it are both known.

After editing, run `npm test`: it checks that every clue can be found, every
reference exists and the case can still be solved.

## Running it on your computer (optional)

1. Install [Node.js](https://nodejs.org) (the LTS version).
2. In this folder run `npm install`, then `npm run dev`.
3. Open http://localhost:3000.

Useful commands: `npm test` (checks), `npm run lint` (code style),
`npm run build` (the same build Vercel does).

Stats are only sent if `.env.local` contains the two Supabase values shown in
`.env.example`; without them the game works normally and sends nothing.
