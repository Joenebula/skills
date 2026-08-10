# Client-side script skimming (Magecart) — 🔴 / 🟠 depending on what's on the page

**The signature e-commerce attack of the last decade** (British Airways, Ticketmaster, and hundreds of shops). It's not a hole in *your* code — it arrives through code you invited in.

**Plain version:** your checkout and account pages load scripts from *other* companies — analytics, a chat widget, a review tool, the payment library. Each of those scripts runs *on your page, in the customer's browser*, with full access to everything on it. If any one of those third parties is compromised, or you're tricked into adding a malicious one, that script can silently read what the customer types and send it to an attacker. The customer sees a normal checkout; the theft is invisible.

## Why this still matters even with card data off your server

Taking card entry onto Stripe/PayPal's side (which this shop does) **blunts the classic card-skim** — the card fields live on the processor's iframe, not your page. But it does **not** eliminate the risk:
- A malicious script can still **skim the personal data that IS on your page** — name, email, delivery address.
- It can **overlay a fake payment form** on top of the real one, or a fake "enter your card" box, capturing details the customer believes are going to Stripe.
- It can **redirect the customer mid-checkout** to a convincing phishing clone.

So for this shop the severity is "serious PII theft and customer phishing" (🟠, rising to 🔴 if any card/payment data or a fake-form overlay is in play), not the catastrophic card breach it would be on a site handling raw cards. Still a real check.

## What to audit

1. **Inventory the scripts on checkout and account pages.** List every `<script src="...">` and every third-party embed (analytics, chat, reviews, tag managers) that loads on pages where customers enter data. For each: is it necessary? do you trust the vendor? Fewer scripts on checkout = smaller attack surface. A tag manager is a particular risk — it lets scripts be added *later* without touching code.
2. **Lock down what can run with a Content-Security-Policy.** This is item 10's CSP, applied specifically to checkout: a strict `script-src` allow-list means the browser refuses to run *any* script not on your list — so an injected skimmer simply doesn't execute. This is the single strongest defence. (Caveat from item 10: a strict CSP can break a legitimate third-party tool, so it needs tuning and testing — propose it, don't blindly apply.)
3. **Check for Subresource Integrity (SRI)** on third-party scripts where possible — an `integrity="..."` hash that makes the browser refuse a script if it's been tampered with since you added it. Not always possible (breaks on scripts that legitimately change), but worth it where it is.
4. **Confirm the payment fields are the processor's hosted/iframe fields**, not your own inputs styled to look like Stripe's — an own-input "card form" is both a PCI problem (payments §6) and a skimming target.

## What an attacker could do

Add or compromise a script on your checkout and harvest customer PII, capture card details through a fake overlay, or phish customers mid-purchase — all invisibly, from code that isn't yours.

## Fix / owner actions

- **Code:** apply a checkout-scoped CSP `script-src` allow-list; add SRI where feasible; remove unnecessary third-party scripts from data-entry pages; ensure real payment fields are the processor's iframe.
- **Owner:** be sparing about what you add via any tag manager (ties to item 19 — third-party tools). Anything added there bypasses code review and lands straight on your live checkout.

## Verify

View the checkout page's loaded scripts (browser dev tools → Network, or the CSP report) and confirm only allow-listed, necessary sources run; confirm an injected/unknown script is blocked by the CSP; confirm card entry happens in the processor's iframe.

## Honest limit

A code audit can inventory the scripts *present in the code* and check the CSP, but it can't vouch for the *ongoing* trustworthiness of a third party — a vendor compromised next month is a new event. This is exactly why the CSP allow-list matters (it defends even against a trusted vendor turning malicious) and why the weekly automation and "keep third parties few" habit are part of the answer.

---

## Affiliate & ad-network scripts — the highest-risk third-party scripts

If the site runs **affiliate ads or ad networks for click-through revenue**, treat those scripts as the *riskiest* members of this whole category, for two reasons:

1. **Ad tech chains scripts through many hands.** "I added one affiliate tag" usually means "I added a script that can load *other* scripts I've never heard of." You cannot audit or trust what an ad network loads downstream — it changes without notice.
2. **They're the scripts most often added *later, casually*** — via a tag manager or a copy-pasted snippet — which is exactly the route that bypasses code review and lands straight on live pages.

**The rule is page separation — monetise the browsing pages, keep the money-and-data pages clean:**
- **Never place affiliate/ad scripts on checkout or account pages** (anywhere a customer enters personal or payment data, or is handed off to the payment iframe). An affiliate link on a product or blog page is low-risk; an ad-network script on the checkout page is the skimming exposure this whole reference is about.
- **Let the CSP enforce it.** The checkout-scoped `script-src` allow-list should simply *not include* ad/affiliate origins — so even if a tag is added by mistake, the browser refuses to run it on checkout.
- **Treat "add this affiliate tag" as a code change**, not a marketing tweak — it deserves the same care as any other script, precisely because it usually skips that care.

**Owner habit (ties to item 19):** keep the list of ad/affiliate scripts short and known, and audit what's in any tag manager — a tag manager lets scripts be added to live pages without touching code.

**Verify:** load a checkout/account page and confirm *no* ad/affiliate script appears in the loaded scripts (dev tools → Network) and that the CSP would block one if added.

(For the *outbound redirect* side of affiliate links — making sure a click-through can't be abused to disguise a phishing link — see `uploads-and-ssrf.md`, open-redirect. For disclosure law and cookie consent on ad cookies, see `regulated-goods-and-legal.md`.)
