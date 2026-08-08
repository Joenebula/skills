---
name: infrastructure
description: Invoke when setting up environments, config, backups, or scaling — separate dev/stage/prod, configure per environment, back up before you need it, and have a rollback path. The first time you think about backups should not be after data loss.
---

# infrastructure — environments, backups, and a way back

The one core truth: **the time to set up backups, environments, and rollback is before the incident, not during it.** Infrastructure is insurance — invisible until something breaks, and then the only thing that matters. Separate your environments, keep config out of code, prove your backups restore, and always have a path back to the last good state.

First-time **bootstrap** (which services, where each key goes) is [[project-setup]]; the **release sequence** (verify → gate → ship → confirm) is [[releasing]]. This skill is the standing environment, not the per-deploy act.

## Law 1 — Separate environments, identical shape

- **Dev / staging / production** are distinct, with **no shared state** — production data never flows casually into dev; dev keys never touch production.
- **Staging mirrors production** as closely as possible (same config shape, same migrations) so "works on staging" means something.
- **Promote** a build through environments; don't rebuild per environment. The artefact that passed staging is the one that ships.

## Law 2 — Configuration per environment, secrets out of code

- **All config is environment-driven** — URLs, feature flags, limits, keys come from the environment, never hard-coded or committed.
- **Secrets** live in per-environment secret storage, rotated, least-privilege ([[project-setup]] maps the keys).
- A new environment is stood up from a **documented config list**, not by copying a teammate's machine. Missing config fails **loudly at boot**, not silently at runtime.

## Law 3 — Backups you have actually restored

| Rule | Why |
|---|---|
| **Automated, regular backups** of the data store | manual backups don't happen. |
| **Test the restore** | an untested backup is a hope, not a backup. Restore to a scratch environment periodically. |
| **Know your RPO/RTO** | how much data can you lose, how fast must you recover? Design to those numbers. |
| **Off-site / separate** from the primary | a backup in the same place that dies with it is no backup. |
| **Retention + privacy** | backups age out per policy and honour erasure obligations ([[privacy-and-compliance]]). |

## Law 4 — A rollback path, always

- Every deploy has a **way back** — redeploy the previous artefact, or a forward-fix you can ship fast ([[releasing]]).
- **Migrations are reversible or forward-fixable** and decoupled from code rollback (you can't un-run a destructive migration by reverting code — [[data-modelling]]).
- **Feature-flag** risky changes so you can disable without a deploy ([[refactoring]]).
- Keep the last-known-good identified so "roll back" isn't a scramble.

## Law 5 — Scale and resilience, sized to reality

- Know the **growth axis** and the **single points of failure**; design the paths that will grow for their expected load ([[performance]]).
- **Health checks + monitoring** so degradation is visible before outage ([[observability]]).
- Scale deliberately (vertical, horizontal, cache, CDN) **when measurement justifies it** — not speculative complexity.

## Stand this up in a new project

- Three environments with a **documented config/secret list** each, from the start.
- **Automated backups + a tested restore** before there's data worth losing.
- A **rollback runbook** (how to revert a deploy, how to handle a bad migration) written before the first production release.
- Per-environment **monitoring and alerting** ([[observability]]).

## Cross-links
- [[project-setup]] — first-time bootstrap order and where every key belongs.
- [[releasing]] — the per-deploy verify → gate → ship → confirm sequence and rollback trigger.
- [[data-modelling]] — reversible migrations, decoupled from code rollback.
- [[refactoring]] — feature flags to disable risky changes without redeploying.
- [[observability]] — health checks and alerting on the running environment.
