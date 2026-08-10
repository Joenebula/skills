# Team, process & domain — the "third space" (neither front-end nor back-end)

Front-end and back-end are the two halves of *your code*. This file is the third space: the things that **aren't code but still decide your security** — who has access, what you do when something goes wrong, and the domain everything hangs off. Almost all of it is **owner-actions and awareness** (Ring 2/3) — the skill can't audit accounts, processes, or registrar settings, so its job here is to hand over plain checklists and standing habits, honestly labelled "assumed not-done until you confirm."

## Contents
- 52 — Team & contractor access management
- 54 — Incident readiness (the fire drill)
- 55 — Domain & registrar layer
- (53, the AI-build lens, lives in SKILL.md + `dependencies.md` — it's a posture over the whole audit, not a standalone item)

---

## 52 — Team & contractor access management — 🟠 standing (🔴 for known orphaned access) [owner]

For a small operation this is statistically one of the *most likely* real breach paths — not a code flaw, a person with access they shouldn't still have. Pure process, no code, which is why a code audit misses it.

Three things go wrong, all quiet:
- **Access that outlives the work.** A freelancer/VA/contractor finishes, and their GitHub/Vercel/Stripe/admin access just stays — a live key to the shop on a machine you don't control. Orphaned access is a classic breach path precisely because nobody watches an unused account.
- **Shared logins.** One admin account for everyone → no accountability (can't tell who did what), can't revoke one person without locking out all, and the credential's been shared over who-knows-what.
- **Access broader than the job needs.** A content editor with full admin "because it was quicker." Least privilege applied to *people*: each person gets the minimum their task needs.

**Owner checklist / standing habits:**
1. Keep a simple list of **who has access to what** (GitHub, Vercel, Stripe, DB, admin).
2. **Individual accounts, never shared** — so actions are attributable and revocable one at a time.
3. **Least privilege** — grant the minimum role the task requires.
4. **2FA for everyone** with access (extends owner-2FA, item 12, to the whole team).
5. **Offboarding step:** the day work ends, remove their access **and rotate** any shared secrets they knew.

**What the skill can (barely) see:** a hardcoded/shared credential in code implies a shared login → ties to the secrets work. Otherwise this is invisible to a code audit.

**Honest note:** process only works if you keep the list and run the offboarding. For a solo shop with no contractors yet, it's a "set the habit before the first contractor" item, not urgent — but far cheaper before than reconstructing who-has-what after five.

---

## 54 — Incident readiness — the fire drill (prepare in advance) [owner, Ring 3]

Every other item prevents a breach. This one assumes prevention *failed* and asks if you're ready. No amount of prevention reaches zero risk, so "what do I do when something goes wrong" is completeness, not pessimism. Improvising *during* an incident is where small problems become big ones (keys rotated wrong, customers told the wrong thing, the legal clock missed). The fix is deciding the answers in advance, while calm.

**Prepare this checklist BEFORE taking real orders (it's not a finding to fix today — it's a plan to have ready):**
1. **Shutdown levers — know where they are before you need them:** how to rotate every key, force-log-out all sessions, put the site in maintenance mode, disable checkout. Half of incident damage is the delay finding these under pressure.
2. **Contacts:** your payment provider's fraud/support line (Stripe, PayPal), hosting support, and whether you must notify the **ICO within 72 hours** (that clock starts whether or not you have a plan). Serious breach → also a solicitor/specialist.
3. **Customer notification:** if personal data is exposed you likely must tell affected people — decide tone and channel in advance so a security incident doesn't become a reputational one.
4. **Investigate-ability:** can you reconstruct what happened? Without logging you can't tell what was taken, making both the ICO report and customer notice a guess. (Ties to the observability note in owner-actions — the one piece with a technical dependency.)

**Rating/honest boundary:** not a vulnerability, so no 🔴/🟠 — an owner-preparedness item. Important-but-not-urgent pre-launch: write the checklist and save the contacts before real orders. A plan prevents nothing; it makes the bad day less bad. Sits with the pentest as a "prevention isn't everything" acknowledgement.

---

## 55 — Domain & registrar layer — 🔴 registrar account / 🟠 lock & expiry [owner]

Sits *above* front and back end: your code can be perfect, but whoever controls your **domain** controls where it points. The most-forgotten foundation. (Item 35 already covered email records SPF/DKIM/DMARC and subdomain takeover — this rounds out the rest.)

- **The registrar account — 🔴.** Your domain lives in an account at a registrar (GoDaddy, Namecheap, Cloudflare, etc.). Compromise it and an attacker **repoints your whole domain at their server** — serving a phishing clone to every visitor while your real site sits untouched. A total-business takeover hinging on one account people secure less carefully than email. Fix: **2FA on the registrar account** (extends owner-2FA to the one account we hadn't named), strong unique password, treat it as a crown-jewel login.
- **Domain/transfer lock — 🟠.** Most registrars offer a "transfer lock" that stops your domain being moved to another registrar without extra confirmation. One toggle, blocks a class of hijacking. Turn it on.
- **Expiry — 🟠.** The mundane killer: the domain lapses (expired card, ignored reminder) and someone grabs it — you lose your address, email, and customers, maybe permanently. Fix: **auto-renew on, backup payment method, renewal reminders going somewhere you'll see.**

**Honest note:** pure registrar/DNS config, nothing in code — Ring 2, "assumed unprotected until you confirm," same posture as your own 2FA. The skill names and checklists it because it's the single most-forgotten foundation: people harden the house and forget who holds the deed to the land.
