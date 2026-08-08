# File uploads & SSRF — conditional (only if the site has these features)

**Detect the feature first.** These are only relevant if the site actually does the thing. If it doesn't, say so and move on — don't raise alarms about features that don't exist.

- **Item 29 (uploads)** applies if the site accepts files: product/admin images, logos, avatars, trade documents, review photos, CSV imports.
- **Item 30 (SSRF)** applies if the *server* fetches a URL it's given: "import image from URL", link previews, avatar-by-URL, outbound webhooks it calls, server-side PDF/screenshot from a link.

---

## Item 29 — File-upload handling

**One line:** letting someone put a file on your server is letting them hand you something you didn't write — so it must be checked, constrained, and stored where it can't do harm.

Ways it goes wrong, worst first:

**Stored where it can be executed — 🔴.** If an uploaded file lands somewhere it can later be *run* (served as code, not data), an attacker uploads a malicious script disguised as an image and triggers it — potential server takeover. Defence: verify the file is *actually* the claimed type (not by extension — a `.jpg` can contain anything), and **store uploads as inert data**. On **Vercel** specifically the serverless filesystem is temporary — push uploads to proper object/blob storage (e.g. Vercel Blob, S3), not into the app. Flag any code writing uploads into the app directory.

**No size/count limits — 🟠.** Enormous or flooded uploads exhaust resources / run up the bill (denial-of-service). Enforce a max size and rate **on the server** (browser limits are bypassable).

**Trusting the filename/type from the browser — 🟠.** The name and claimed type come from the uploader and can be crafted to escape into another folder or slip past an extension-only check. The server should **generate its own safe filename**, validate real content type, and never use the uploaded name to decide where the file goes.

**Confidential uploads publicly readable — 🔴.** Trade documents or anything with personal/business data stored at a guessable public address is the same exposure as the data-exposure reference — needs "only the right person can fetch this" access control.

**What someone could do:** worst case take over the server; commonly, run up costs, break the site, or read other customers' documents.

**Fix / verify:** size + rate limits server-side; real content-type validation; server-generated filenames; blob storage not app filesystem; access control on private files. Verify by attempting an oversized upload (rejected), a disguised-executable upload (rejected or stored inert), and fetching another user's file (denied). **Bucket permissions are dashboard config → owner step**, not something the code proves.

---

## Item 30 — SSRF (Server-Side Request Forgery) & user-supplied URLs

**One line:** SSRF is when your server is tricked into fetching an address an attacker chose, and made to reach places it shouldn't.

Your server sits inside a private network with access to things the public can't reach — internal services and, on a cloud host, a special **metadata address** reachable only from inside that can hand out cloud credentials. SSRF is when a "fetch this URL" feature is handed one of *those* internal addresses instead of a normal web address, and the server dutifully fetches it and returns the result.

Red flag — user input becomes a server-side fetch with no constraint:
```js
// DANGEROUS: fetches whatever address arrives
const img = await fetch(req.body.imageUrl);
```

**What someone could do:** reach internal systems never meant to be public; worst case pull **cloud credentials** from the internal metadata address, escalating to serious access. A related, milder cousin: an *open redirect* (site bounces users to a supplied URL) mainly helps make phishing links look like they come from your domain.

**Fix:** don't let user-supplied addresses go anywhere. Refuse internal/private ranges and the cloud metadata address; ideally allow only an explicit list of destinations the feature needs; validate before fetching; cap size and time. Same root as the whole audit — *the server decides what's allowed, not the input.*

**Honest limit:** SSRF has many creative bypasses (odd address formats, redirects that sneak past a naïve check). Flag an obviously-unguarded fetch confidently and propose the standard protections, but "looks guarded" isn't "proven safe" — this is a strong candidate for the pentest caveat.

**Verify:** a request pointing the feature at an internal/metadata address is refused.

**Ratings recap:** 🔴 if an unguarded server-side fetch can reach internal/metadata addresses; 🟠 for unconstrained outbound fetches usable for abuse/resource exhaustion; 🟡 for open-redirect. Suppress the whole item if the server never fetches user-supplied URLs.

### Affiliate / click-through redirects (open-redirect flavour) — 🟡

If the site runs **affiliate ads**, click-throughs redirect the customer out to another site. Keep the redirect destination safe:

- The destination must come from **your own fixed list of known affiliate targets**, never from a URL parameter a visitor can edit. A redirect like `/go?url=<anything>` lets someone craft a link on *your* trusted domain that bounces to a phishing site — making the scam look like it came from you.
- Same root principle as everything else: *the server decides where it's willing to send people, not the input.*

**Verify:** editing the destination parameter on an affiliate/redirect link to an arbitrary site is refused (only known affiliate targets resolve).
