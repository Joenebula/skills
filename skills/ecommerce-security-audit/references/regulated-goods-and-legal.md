# Regulated goods & UK selling law

This is the outer ring: legal and compliance duties that mostly live *outside* the code. The skill **flags gaps and points onward — it does not certify legal adequacy.** Say that plainly. For a live shop, an hour with someone who does UK e-commerce / data-protection law is worth it. None of this is legal advice.

Some of it *is* code-checkable, though — those parts get real findings. The rest is an owner checklist.

## Contents
1. Age / identity verification for regulated goods (item 25)
2. UK GDPR & data-protection duties (item 17)
3. UK online-selling legal basics (item 26)
4. Customer-facing 2FA (item 18)
5. Affiliate / ad monetisation — disclosure & cookies (item 36)

---

## 1. Age / identity verification for regulated goods — 🔴 when disabled, UI-only, or falsely claimed

On the list *because of what the shop sells* (e.g. alcohol), not as a universal web flaw. If you sell an age-restricted product, the age check must be **actually enabled, actually enforced by the server, and not merely claimed.**

Three failure modes — the project that inspired this had all three at once:
- **Switched off** — `AGE_GATE_ENABLED = false`; the gate exists but never renders (a fail-open control, waves everyone through).
- **No server-side enforcement** — even if the pop-up shows, if the *server*/checkout never checks age, anyone skips it by going straight to checkout (same flaw as admin-in-the-UI-only). A real age control gates the *transaction*, not just a modal.
- **Falsely advertised** — the site states "age verified at checkout" when nothing verifies it. Worse than silence: a false safeguard claim is what makes an underage sale indefensible.

**What's at stake:** legal/licensing — the ability to trade — not a hacking risk. The "attacker" is essentially a normal underage customer.

**What the skill can see in code:** whether a gate exists, is enabled, is enforced server-side (not just UI), and whether the site *claims* verification the code doesn't perform. The disabled-and-claimed pairing is 🔴.

**Where it stops:** whether your verification *method* (self-declared date of birth vs ID check at delivery) is legally *sufficient* is a licensing question → owner-get-advice. The skill checks the code is honest and enforcing; it does not certify legal sufficiency.

---

## 2. UK GDPR & data-protection duties — 🟠 owner-awareness (cookie enforcement is 🔴 and code-checkable)

Holding usernames, passwords, addresses, and order history = "personal data" under UK law, with duties regardless of code quality. Plain owner checklist:
- A **privacy policy** stating what you collect and why (not placeholder text).
- **Collect only what you need** — less to lose. Flag data collected with no clear purpose.
- A way for customers to **see and delete** their data on request.
- Know a serious breach must be **reported to the ICO within 72 hours**.

The skill can flag obvious code-visible gaps (placeholder legal pages, data collected for no purpose) but **this is awareness, not legal advice.**

---

## 3. UK online-selling legal basics — 🟠 owner-awareness (some parts code-checkable)

Broader than GDPR. Your project surfaced several:

**Company identity details.** UK e-commerce rules require a trading business to display its registered company number, registered office, and VAT number (if registered) — usually the footer or a legal page. The skill can flag their *absence* in the code but can't know your actual numbers → owner fills in.

**Honest returns / refunds terms.** UK consumer-contract rules give buyers cancellation/return rights. Flag the dangerous mismatch: checkout *promising* "14-day / 30-day returns" while there's **no returns page or process** behind it (a UI-claims-vs-reality problem). Flag placeholder "replace this" legal pages.

**Cookie consent that actually works — 🔴, and genuinely code-checkable.** UK/EU rules (PECR + GDPR) require non-essential tracking *not to run until the visitor agrees*. The common flaw: a cookie banner that "writes a choice nothing reads," with analytics loading *before* consent — a control that controls nothing. Check: does anything actually *read* the consent choice, and does tracking hold off until consent is given? A banner ignored by the code is flagged.

**The skill's role:** surface the gaps as a plain checklist — placeholder pages, missing company info, returns promise with no policy, cookie banner that doesn't work — then say plainly it **flags what's missing/inconsistent; making content legally correct is a human job.**

---

## 4. Customer-facing 2FA — 🟠 recommendation (not mandatory)

Separate from the owner's own 2FA (which is a hard requirement — see owner-actions). This is whether *shoppers* can secure their own accounts. The skill *can* see this in code and recommends it, but it's a **business trade-off** (friction at login, some drop-off), so it's flagged as a recommendation, not a must — the owner's call, with the trade-off named. Keep it clearly distinct from owner 2FA in the report so there's no confusion about which is which.

---

## 5. Affiliate / ad monetisation — disclosure & cookies (item 36, owner-awareness)

If the site runs **affiliate ads or click-through revenue**, two duties bite — both compliance, not code vulnerabilities, so the skill *points*, it doesn't certify.

**Disclosure (advertising/consumer law).** In the UK, affiliate and paid links must be **clearly disclosed** to consumers — people have to be told a link earns you money (ASA/CMA rules). This is advertising law, same family as the selling-law items above. The skill can note whether disclosures appear present, but **getting it legally right is a get-advice item**, not something the skill certifies. Flag it as an owner to-do; don't rule on it.

**Cookies bite harder.** Ad and affiliate networks almost always drop tracking cookies — which makes the cookie-consent duty in §3 *more* important, not new. Non-essential ad/affiliate tracking **must not fire before the visitor consents.** This part *is* code-checkable (does anything read the consent choice; does the ad/affiliate script hold off until consent?) and is covered by §3 — affiliate ads just raise the stakes.

**The security side lives elsewhere, deliberately:** affiliate/ad *scripts* are third-party scripts → `client-side-skimming.md` (keep them off checkout/account pages, govern with CSP). Affiliate *redirects* → `uploads-and-ssrf.md` (fixed destination list, no user-controlled redirect). This item is only the compliance half. Keep the security half in those files so the boundary between "security finding" and "compliance awareness" stays clean.
