---
name: security
description: Invoke when handling auth, permissions, secrets, user input, file uploads, third-party calls, or anything outward-facing — the trust model, where to gate, and the input/secret/dependency rules. Assume every input is hostile until proven otherwise.
---

# security — assume hostile input, gate on the server

The one core truth: **the client is attacker-controlled; only the server can enforce anything.** A check the browser does is a convenience for honest users and nothing to a malicious one. Every rule that matters is enforced server-side, on data you re-validate, with the least privilege that does the job.

Write-path gating specifics (the sacred write path, capability tables, service-credential usage) live in [[engineering-standards]] and are watched by the security-route-auditor — this skill is the broader model; defer the gating mechanics there.

## Law 1 — Authentication vs authorization (don't conflate)

- **Authentication** = who are you (a verified session/token). **Authorization** = what may you do.
- Verify **both** on every write endpoint, server-side, returning 401/403 **before any state change**.
- Sessions/tokens: short-lived, rotated, revocable, `HttpOnly`+`Secure` cookies or equivalent; never in URLs or local storage if avoidable.

## Law 2 — Authorize on capabilities, not role names

- Roles are **additive** (an actor may hold several). Map roles → **capabilities**; code asks "can this actor do X?", never "is this actor an admin?".
- **Least privilege**: each actor/credential gets the minimum. A privileged/service credential is used **only for the write**, and only *after* the user-scoped auth check passed — it never gates.
- New permissions ship as a migration the user applies; query only values an applied migration has (enum gotcha — [[data-modelling]]).

## Law 3 — All input is hostile

| Risk | Defence |
|---|---|
| **Injection (SQL/command/NoSQL)** | Parameterised queries / safe APIs only. Never build a query by string concatenation. |
| **XSS** | Escape on output by default; treat any stored/echoed user text as untrusted; avoid raw-HTML sinks, and sanitise if unavoidable. |
| **CSRF** | State-changing requests need an anti-CSRF token or same-site cookies + origin checks. |
| **Mass assignment** | Whitelist the fields a request may set; never bind a request object straight onto a record. |
| **Path/SSRF** | Validate file paths and outbound URLs against an allow-list; never fetch a user-supplied URL blind. |
| **File upload** | Check type/size, store outside the web root or in object storage, never execute, randomise the name. |

Validate **server-side** against an explicit schema; reject by default, allow by exception.

## Law 4 — Secrets and data protection

- Secrets live in **environment/secret storage**, never in code, the repo, the database, logs, or client bundles. Rotate on exposure. ([[project-setup]] maps where each key goes.)
- **In transit**: TLS everywhere. **At rest**: encrypt sensitive fields; hash passwords with a slow algorithm (never reversible encryption).
- **Never leak** secrets, PII, stack traces, or raw upstream errors in a response or client-visible log — see [[observability]] for safe logging.
- **A gate on a parent does nothing for its children.** For every gated table or resource, **list what points AT it and check each one separately.** Row-level rules are per table; a join row looks like it carries no information of its own and carries the whole fact. See [[data-modelling]] Law 3.

  > Found 28 Aug 2026 by a test, not by review. `events` was correctly hidden unless published. `event_artists` and `event_genres` — written in the **same migration**, by someone with the rule in mind — were `using (true)`. So an anonymous reader could not learn a draft event's title, date or venue, and could ask a different table for **the full line-up of an unannounced show**. One `SELECT`, no exploit. What leaks is not "a UUID": it is the booking nobody has announced yet.

## Law 5 — Dependencies, abuse, and audit

- **Supply chain**: pin versions, review what you add, patch known CVEs, minimise the dependency surface.
- **Rate-limit & throttle** auth, write, and expensive endpoints; lock out credential-stuffing.
- **Audit log** every privileged/destructive action (who, what, when) — append-only, reviewable.
- **Destructive/bulk ops are two-step**: a preview (counts + sample) then an explicitly-confirmed execute ([[ask-dont-guess]]).

## Stand this up in a new project

- Decide the **trust model** on day one: actors, capabilities, what each may touch.
- Put **auth + validation at the boundary** (a single gateway/middleware), not sprinkled per-handler.
- Add the **security-route-auditor** to the review flow; make a server-side authz check part of the definition of done ([[reviewing-code]]).
- A **pre-launch hardening pass**: secrets out of code, debug/open-access flags off, rate limits on, dependencies patched.

## Cross-links
- [[engineering-standards]] — the sacred write path, capability gating, two-step destructive ops, no-leak rule (security-route-auditor).
- [[auth-and-accounts]] — the account lifecycle, session flows, and role administration built on this trust model.
- [[ask-dont-guess]] — anything destructive/outward-facing → recommend, then get a yes.
- [[privacy-and-compliance]] — lawful basis, consent, retention, and subject-access on top of these controls.
- [[project-setup]] — secret hygiene and where every key belongs.
- [[reviewing-code]] — the security pass of every review.
