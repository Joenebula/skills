# Payments & commerce

This is the most important file for an e-commerce site. These flaws let people buy for free, pay less than the price, or get goods without paying — and they are *extremely* common in AI-generated checkout code because the AI often wires up the happy path (customer pays, order appears) without the checks that stop the path being abused.

Read the actual checkout, cart, and payment code. Don't infer — trace how a price gets to the payment processor and how an order gets marked "paid".

## Contents
1. Trusting the price from the browser (Critical)
2. Trusting quantity / totals / currency from the browser (Critical/High)
3. Unverified payment webhooks (Critical)
4. Fulfilling the order before payment is confirmed (Critical)
5. Discount, coupon, and gift-card abuse (High)
6. Card data touching your own server (Critical — PCI)
7. Inventory races and overselling (Medium)
8. Missing idempotency / double charges (Medium)
9. Simulated / fake / "demo" payment paths shipped to production (Critical)
10. Double-spend / race conditions on money, points, stock, codes (Critical)

---

## 1. Trusting the price from the browser — 🔴 Critical

**The single most common serious flaw in AI-built shops.** The browser sends the price (or the whole cart with prices) to the server, and the server charges whatever it's told.

Red flag — the amount comes from the request body:
```js
// DANGEROUS: server charges whatever the browser says
const { productId, price, quantity } = await req.json();
const session = await stripe.checkout.sessions.create({
  line_items: [{ price_data: { currency: 'gbp', unit_amount: price, ... }, quantity }],
});
```
Anyone can open browser dev tools (or use a tool like Burp/curl) and change `price` to `1` before it's sent. A £500 item is bought for one penny.

**What an attacker does:** buys your entire catalogue for pennies. This is trivial and happens in the wild constantly.

**Fix — the server looks up the price itself, from a trusted source, and ignores any price sent by the browser:**
```js
// SAFE: browser sends only what to buy; server decides the price
const { items } = await req.json(); // [{ productId, quantity }] — NO prices
const products = await db.product.findMany({
  where: { id: { in: items.map(i => i.productId) } },
});
const line_items = items.map(i => {
  const product = products.find(p => p.id === i.productId);
  if (!product) throw new Error('Unknown product');
  const quantity = Math.max(1, Math.floor(Number(i.quantity))); // whole, positive
  return {
    price_data: { currency: 'gbp', unit_amount: product.priceInPence, product_data: { name: product.name } },
    quantity,
  };
});
const session = await stripe.checkout.sessions.create({ line_items, mode: 'payment', ... });
```
Even better: store products in Stripe and pass the Stripe `price` ID, so the price lives in one trusted place.

**Verify:** with dev tools open, edit the outgoing request to send a lower price. The charged amount should be unchanged. If you can lower the total, it's not fixed.

---

## 2. Trusting quantity, totals, or currency from the browser — 🔴/🟠

Same root cause, other fields:
- **Quantity** — if the server trusts a negative quantity, `-5 × £100` can become a *credit*. Always coerce to a whole positive integer server-side (see fix above).
- **Total** — never accept a `total` or `amount` from the browser. Recompute it server-side from the trusted per-item prices.
- **Currency** — never take the currency from the browser; a switch from a strong to a weak currency changes what's really paid. Fix the currency server-side per product/store.

**Verify:** try a negative quantity and a browser-supplied total; the server should reject or recompute, never obey.

---

## 3. Unverified payment webhooks — 🔴 Critical

A **webhook** is a message the payment processor (Stripe/PayPal) sends to your server to say "this payment succeeded". Your site marks the order paid when it arrives. The danger: if your server doesn't *verify the message really came from the processor*, anyone can send a fake "payment succeeded" message to your webhook URL and get free goods.

Red flag — the handler reads the event but never verifies the signature:
```js
// DANGEROUS: trusts any POST to this URL
export async function POST(req) {
  const event = await req.json();
  if (event.type === 'checkout.session.completed') {
    await fulfilOrder(event.data.object); // anyone can trigger this
  }
}
```

**What an attacker does:** finds the webhook URL (often guessable, e.g. `/api/webhook`), POSTs a fake `checkout.session.completed`, and your site ships the order. Free products, no payment.

**Fix (Stripe) — verify the signature against the raw body:**
```js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text(); // RAW body — not req.json()
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
  if (event.type === 'checkout.session.completed') {
    await fulfilOrder(event.data.object);
  }
  return new Response('ok', { status: 200 });
}
```
Two things AI code gets wrong here:
- **It must be the RAW request body.** `constructEvent` needs the exact bytes; `req.json()` parses (and mangles) them and verification will fail or be skipped. In App Router use `await req.text()`. In Pages Router disable the body parser (`export const config = { api: { bodyParser: false } }`) and read the raw stream.
- **`STRIPE_WEBHOOK_SECRET`** comes from the Stripe dashboard (Developers → Webhooks) and is different from your API key. It must be set as a server env var. **PayPal** has the equivalent: verify the webhook via PayPal's verification API / signature headers before trusting it.

**Verify:** send a plain POST to the webhook URL with a made-up JSON body (e.g. via curl). It must be rejected with a 400, and no order should be created. If a fake body fulfils an order, it's not fixed.

---

## 4. Fulfilling the order before payment is confirmed — 🔴 Critical

Two versions of the same mistake:

**(a) Fulfilling on the browser redirect.** After paying, the customer's browser is sent to a `/success` page, and the site creates/ships the order there. But a user can navigate straight to `/success` (or close the tab before paying) — the redirect is not proof of payment.

**(b) Fulfilling on "payment started" instead of "payment succeeded".** Marking an order paid when the payment *intent is created* rather than when it actually *succeeds*.

**Fix:** the order is only marked paid and fulfilled from the **verified webhook** (section 3), on the success event (`checkout.session.completed` with `payment_status === 'paid'`, or `payment_intent.succeeded`). The `/success` page is just a "thank you" screen — it shows status, it does not grant anything. Treat the webhook as the single source of truth for "paid".

**Verify:** visit the success URL directly without paying. No order should be created or fulfilled.

---

## 5. Discount, coupon, and gift-card abuse — 🟠 High

Common holes:
- **Discount applied on the browser** and trusted by the server (same class as price tampering) — attacker sets a 100% discount. Fix: validate and apply the discount server-side from the coupon record.
- **No usage limit / no expiry check** — a single-use or expired code works forever. Fix: check `usesRemaining`, `expiresAt`, and per-customer limits atomically at redemption.
- **Stacking** — multiple codes combine below cost. Fix: enforce one code (or explicit stacking rules) server-side.
- **Gift-card balance not decremented atomically** — the same balance spent twice via rapid requests. Fix: decrement inside a transaction with a row lock / conditional update.

**Verify:** try an expired code, the same single-use code twice, and a browser-edited discount percentage. All should be rejected server-side.

---

## 6. Card data touching your own server — 🔴 Critical (PCI)

If your own form collects the raw card number/CVV and sends it to *your* backend, you have taken on the full weight of PCI-DSS compliance — and almost certainly aren't meeting it. AI sometimes builds a "custom" card form that POSTs card details to an API route. This is a serious liability.

**The rule:** card data must go **directly from the customer's browser to the payment processor**, never through your server. Your server only ever sees a token/reference.

**Fix:** use the processor's hosted or embedded fields, which keep card data off your server entirely:
- **Stripe** — Stripe Checkout (hosted page) or Payment Elements / Card Element (the input lives in a Stripe iframe). You get a token; you never see the PAN.
- **PayPal / Google Pay / Apple Pay** — their SDK buttons; the wallet handles the card.

Delete any code path where a raw card number, expiry, or CVV reaches your backend, logs, or database. **Never log or store card numbers or CVV — storing CVV is forbidden outright.**

**Verify:** search the codebase and logs for card fields reaching the server (`cardNumber`, `cvv`, `cvc`, `card_number`, PAN-like patterns). There should be none. The scan script flags obvious cases.

---

## 7. Inventory races and overselling — 🟡 Medium

Two people buy the last item at the same time; both succeed because the stock check and the decrement aren't atomic (a "time-of-check to time-of-use" race). Fix: decrement stock inside the same database transaction as the order, with a conditional update that only succeeds if stock is still available (`UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock >= 1`), and treat "0 rows updated" as out-of-stock. On serverless (Vercel) this matters more because many function instances run in parallel.

**Verify:** where feasible, fire two concurrent purchases of a one-stock item; only one should succeed.

---

## 8. Missing idempotency / double charges — 🟡 Medium

If a request is retried (flaky network, double click, webhook redelivery), the customer can be charged twice or the order duplicated. Fix: use Stripe's idempotency keys on charge/intent creation, and make the webhook handler idempotent — record which event IDs you've processed and ignore duplicates (`if (await alreadyProcessed(event.id)) return ok;`). Processors *do* redeliver webhooks, so this is expected, not exotic.

**Verify:** process the same webhook event twice; the order/charge should be created once.

---

## Quick triage order for a checkout review

1. Where does the price come from? (must be server-side) — §1
2. Is the payment webhook signature-verified against the raw body? — §3
3. Is the order fulfilled *only* from that verified webhook? — §4
4. Does any raw card data touch the server? — §6
5. Are discounts/quantities validated server-side? — §2, §5
6. Are stock and charges race-safe and idempotent? — §7, §8

The first three are the ones that most often let people take products for free. Start there.

---

## 9. Simulated / fake / "demo" payment paths shipped to production — 🔴 Critical

**This is the defining flaw of AI-built shops and often the single most damaging finding.** To get the checkout flow working, an AI builder writes a "pretend it worked" version — marks the order paid, credits points, shows a confirmation — with *no real charge*. It is meant to be replaced before launch. Frequently it isn't.

This is **distinct from price-tampering (§1)**: there, a real payment flow is fed a wrong number. Here there is **no real payment at all** — the whole transaction is theatre. A price check won't catch it because there's no price to tamper with. It needs its own hunt.

Red flags — a payment or membership path that completes without a gateway call:
```js
// DANGEROUS: order created and marked paid, nothing charged
persistOrder(..., { status: "simulated" });          // or "demo", "test", "mock", "fake"
// DANGEROUS: paid tier granted with no gateway call
await subscribeTier({ tier: "premium", status: "active" }); // no Stripe/PayPal call anywhere
// Comment tells you outright:
// "Payment is simulated in this demo"
```

**How to hunt it:** search for the marker vocabulary — `simulated`, `demo`, `mock`, `fake`, `placeholder`, `stub`, `TODO`, `for now`, `test mode`, `dummy` — then look at *where* each sits. A `mock` in a test file is fine. The same word in a **checkout action, membership grant, auth check, order-fulfilment, or access path is 🔴**, because there a placeholder means a security control that isn't real. (This "marker only matters in a sensitive path" logic is the boundary rule — don't flag harmless TODOs in cosmetic features.)

**What an attacker (or ordinary customer) could do:** just *use the shop* — receive real, fulfillable orders, paid memberships, and loyalty points without paying. No skill required; exploiting it doesn't even look like an attack.

**Fix — this is a product decision, so propose, don't auto-wire.** Whether to *disable the fake path* or *wire the real Stripe/PayPal integration* is the owner's call — never silently build a payment integration. The one safe thing you may do immediately: make the fake path **fail closed** — refuse to complete and mark nothing paid — so a not-yet-wired checkout can't hand out free goods while the owner decides.

**Verify:** attempting to check out via the non-real path no longer creates a paid/fulfillable order; no order reaches "paid" without a verified gateway response (see §3).

---

## 10. Double-spend / race conditions on money, points, stock, single-use codes — 🔴 Critical

Broadens §8 (double-charge) to **every limited resource**. If two identical requests arrive in the same instant, a naïve *check-then-act* lets both succeed when only one should.

Plain version: the code does "check the balance is ≥ 100, then subtract 100." Between the check and the subtract there's a gap. Fire the request twice at once and both copies pass the check before either subtracts — the resource is spent twice. Same shape for stock ("is it in stock? yes" → oversell), single-use coupons, gift-card balances, one-per-customer offers.

Red flag — read then separate write, no atomic guard:
```js
// DANGEROUS: TOCTOU — two parallel requests both pass the check
const acct = await prisma.account.findUnique({ where: { id } });
if (acct.points < 100) throw new Error("insufficient");
await prisma.account.update({ where: { id }, data: { points: acct.points - 100 } });
```

**What an attacker could do:** redeem a reward many times off one balance, buy stock you don't have, reuse a single-use code — money and goods out the door, triggerable by anyone firing the same legitimate request in parallel. It's theft, which is why it's a security finding, not a QA bug.

**Fix — flag reliably, fix carefully.** Make the operation **atomic**: a conditional update ("subtract 100 *only if* balance is still ≥ 100" in one DB operation), a transaction with proper locking, or a unique constraint that makes a second identical spend impossible to record. The exact fix depends on the database, and a naïve fix can leave a subtle residual gap — **propose the change, show it, and recommend testing under concurrent load** rather than silently rewriting core money/stock logic.

**Verify:** firing the same spend twice in parallel results in exactly one success; stock cannot go below zero; a single-use code cannot be applied twice.
