---
name: auth-and-accounts
description: Use when building sign-up, sign-in, sessions, password/magic-link flows, account settings, or role administration — the complete account lifecycle, server-verified sessions, enumeration-safe errors, and the negative paths that must stay closed. Auth is the first journey every user walks and the first one regression must cover.
---

# auth-and-accounts — the front door, complete and closed

The one core truth: **auth is the one flow every user walks through and every attacker probes — it must be complete (no half-wired reset link), server-verified (no client-asserted identity), and its negative paths are product behaviour, not edge cases.** "Signed out stays out" is a feature you build and test, not a default you hope for.

The capability-gating mechanics live in [[engineering-standards]]; the first-admin bootstrap is in [[project-setup]]. This skill is how the account experience itself gets built.

## Law 1 — Sessions are server-verified, on every request

- Identity comes from a **verified session/token resolved server-side** — never from a client-sent user id, email, or role flag.
- Sessions are short-lived, revocable, and carried in `HttpOnly`+`Secure` cookies or the platform's equivalent; **rotated on privilege change** (sign-in, password change, role grant).
- **Sign-out actually invalidates the session server-side** — not just clears local state. A "signed out" user whose old token still works is a broken promise.
- Use the **platform's auth primitives** (managed auth, hosted flows, proven libraries) — never hand-roll password hashing or session crypto.

## Law 2 — The lifecycle is complete, or honestly absent

Every account flow is wired end-to-end or not offered — a dead "Forgot password?" link is a broken-promise anti-pattern.

| Flow | Must include |
|---|---|
| **Sign-up** | Validated input, verify the email before granting privileges, a clear landed-signed-in end state. |
| **Sign-in** | Password and/or magic link; the failure state helps honestly without leaking (Law 3). |
| **Reset / recovery** | A single-use, expiring token; on success, **invalidate existing sessions** and confirm to the user. |
| **Change email** | Verify the NEW address before switching; notify the OLD address (account-takeover tripwire). |
| **Change password** | Require the current credential; rotate the session; notify. |
| **Delete account** | A real, complete erasure path — every table, synced third parties included ([[privacy-and-compliance]]). |

Auth forms are still forms: preserve input on failure, disable the submit while processing, inline errors ([[forms-and-input]]).

## Law 3 — Enumeration-safe and abuse-resistant

- **The same response whether or not the account exists** — "If an account exists for that address, we've emailed a link." Sign-up, sign-in, and reset must not reveal *who has an account* through messages or timing.
- **Rate-limit and throttle** every auth endpoint; lockout/captcha under repeated failure — credential stuffing arrives on day one.
- Failure messages are **generic to the caller, specific in the logs** — log attempts with context, never with credentials ([[observability]]).

## Law 4 — Roles and capabilities are administered, not hard-coded

- Roles are additive; code asks **capabilities**, never role-name strings — the capability table lives in [[engineering-standards]].
- The **first admin is bootstrapped** by migration/allowlist ([[project-setup]] gotcha) — get it wrong and nobody can administer the app.
- Granting/revoking roles is a **gated, audited admin action** (who, whom, what, when — [[observability]]); it happens through a real UI or documented process, never by hand-editing rows.
- A revoked capability **takes effect** — the session is re-checked or refreshed, not trusted until next sign-in. The denied actor stays denied *now*.

## Law 5 — The negative paths are the must-pass regression set

These are the first E2E journeys the project writes, before feature work ([[regression-testing]] Layer C):

1. **Signed out stays out** — every protected surface refuses the anonymous caller (assert the refusal, don't assume the guard).
2. **Sign in / sign out round-trip** — in, verified in, out, verified out.
3. **The gated privileged action** — works for the entitled actor, **refused** for every lesser one.
4. **Expired/invalidated tokens are refused** — a stale reset link and a post-signout session both fail cleanly.

Seed **one test account per privilege level** in the test target so these journeys always have actors to run as.

## Stand this up in a new project

- Wire the **session-resolution helper and the capability check once, at the boundary** — every route uses them; none re-implements them ([[engineering-standards]]).
- Bootstrap the admin, then immediately **seed the per-privilege test accounts**.
- Write the four negative-path journeys as the project's **first E2E specs** — they gate everything after.
- Build the lifecycle flows from the shared form components with honest states ([[forms-and-input]], [[design-system]]).

## Cross-links
- [[engineering-standards]] — capability gating, the sacred write path, server-side enforcement.
- [[project-setup]] — admin bootstrap and where the auth keys live.
- [[privacy-and-compliance]] — deletion, export, and consent as real account features.
- [[regression-testing]] / [[preflight]] — the auth journeys as permanent must-pass checks.
- [[forms-and-input]] — auth forms that don't lose work or lie about state.
- [[email-and-notifications]] — verification, reset, and security-notification sends.
