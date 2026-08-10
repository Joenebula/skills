# Business-logic / workflow abuse — 🟠 needs your review (specific gaps can be 🔴)

**This is the hardest area to catch mechanically — be honest about that.** Every other item has a recognisable code shape. This one often has *no wrong-looking code at all* — each step is correct; the flaw is the *sequence* things can be done in, and the *state* the system is left in. Catching it reliably needs to know the *intended* workflow, which is business knowledge in the owner's head, not a code fact.

So the skill's job here is **flag-and-question, not certify.** Map the sensitive workflows, point at the risky spots, and ask the owner the questions a human auditor would. A clean pass means "no *obvious* gaps found, and here are the questions you should answer" — never "your business logic is sound."

## Workflows to map and the questions to ask

**Refunds / returns:**
- Can an order be cancelled *after* it ships and still trigger a refund (keep goods + money)?
- Can a return credit be applied twice?
- Can an order paid with points be refunded as *cash*?
- Can someone refund more than they paid, or refund an order that isn't theirs (an access-control check wearing a payments hat)?

**Order-state manipulation:**
- Can order contents or the delivery address be changed *after* payment but *before* dispatch (pay for one thing, receive another; redirect someone's paid order)?

**Loyalty / referral gaming:**
- Can someone refer themselves with throwaway accounts to farm signup bonuses?
- Can points be earned on an order, then the order cancelled while the points are *kept*? (The mirror of the double-spend race, but across the cancel workflow.)

**Coupon / promotion sequencing:**
- Can a "first order" discount be reused by never technically completing a first order?
- Can promotions never meant to combine be stacked by applying them in a particular order?

## What an attacker could do

Extract money or goods by *using the shop's own features in an unintended sequence* — no hacking, no special access, just understanding the workflow better than it was designed. Like fake payment paths, it doesn't look like an attack, and the losses may not show up until they add up in the order data.

## How to handle it

- **Map** the sensitive workflows found in the code (refund, cancel, order-edit, points earn/burn, referral, promotion).
- For each, surface the **structured questions above** in the report, pointing at the specific code spots — as prompts for the owner's decision.
- Where a gap is **confirmable from code alone** — e.g. "cancelling an order does not reverse the points it granted," which you *can* often see — rate it on impact, typically 🔴 when it's directly money-extracting, and fix it (propose-first, it's money logic).
- Otherwise present as 🟠 needs-your-review and be explicit this is a **human-judgement area** that edges toward what a professional pentest covers.

## Verify

For any confirmed gap: perform the sequence and confirm the unintended benefit no longer applies (the cancelled order reverses its points; the twice-applied credit is refused; the post-payment address change is blocked or re-validated).
