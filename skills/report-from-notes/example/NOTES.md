# Harbour — run notes (raw)

These are deliberately messy, out of order, and contain the traps a real set of notes
contains. This is the **input** to the dummy test. Paste `PROMPT.md` into a chat, then
paste this file underneath it.

Project path: `C:\Work\harbour`
Branch: `booking-v2`
Started from save point: `a91c4f0`
Run resumed 2 times. Notes file: `notes/RUN-NOTES.md`

---

## Setup — 24 Aug, 09:12

Queue agreed with Ravi: 5 tasks. Task 5 (delete the old `legacy/` booking engine) marked
**destructive — must stop and ask before running**. Rule carried over from the last run:
**`payments/` must not be touched by anything in this queue.**

## Task 1 — 24 Aug, 10:40

Rebuilt the date picker as a single component. 3 files changed, 412 lines removed.
Ran: `npm test` -> ALL PASS (188 tests). `npm run lint` -> ALL PASS.
Nobody has opened it in a browser. Not once. Compiles and passes, that's all we know.

## Task 2 — 24 Aug, 14:05

Moved the availability query behind a cache. Ran `npm test` -> ALL PASS.
I set the cache lifetime to 60 seconds without asking — the queue didn't say. Cheap to
change, it's one number in `config/cache.ts`. Flagging it.

## Task 3 — 25 Aug, 11:30

Wrote the three supplier notification emails and handed the drafts to Ravi on 25 Aug for
sending. Ravi needs the final pricing table from Dawn before he can send them. Nothing more
for us to do on this one — the writing is finished.

Also: Dawn still owes us the 2026 rate card. Chased 25 Aug, no reply yet.

## Task 4 — 26 Aug, 16:20

Migrated the bookings table. `npm test` -> ALL PASS. `npm run migrate:verify` -> ALL PASS.
Ran against the staging copy only. **Nobody has run this against production data.**
Same 20 minutes in a browser on staging would settle this AND the date picker from task 1.

Noticed while in there: `utils/date.ts` has two functions that do the same thing. Left it
alone, not in the queue, would widen the diff.

## Task 5 — 26 Aug, 17:00 — STOPPED

Task 5 deletes `legacy/`. That's roughly 6,000 lines. I have NOT counted it properly and
I'm not going to guess the number. Recoverable from the save history, but not from the
running app if it goes out. Ravi has to say yes before this runs. Everything else in the
queue is finished, so the run has stopped here.

## Resolved along the way

- 25 Aug: the "does the cache break the calendar" worry — I ran `npm run test:calendar`
  and watched it come back ALL PASS. **Settled. Do not carry this forward.**
- 25 Aug: Ravi confirmed 60s cache lifetime is fine. Wait — no he didn't, he said he'd
  look at it. Still open.

## One thing went wrong

Task 2 first attempt cached the wrong key and returned another user's availability in the
test suite. Caught by `npm test` -> FAILED. Fixed by keying on `userId` too. Rule adopted:
**every cache key includes the user id.**
