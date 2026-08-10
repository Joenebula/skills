---
name: mydesignskill
description: House design rules and a curated visual reference library for marketing and product pages — heroes, eyebrow labels, stat rows, feature cards, logo walls, FAQ accordions, testimonials, CTA bands and footers. Encodes two hard visual constraints (no outline borders on containers; Material Design typefaces only unless asked) plus the aesthetic language drawn from five reference designs. Use when building, restyling or reviewing landing pages, marketing sites or product UI where a refined, non-"AI-slop" look is wanted. Takes precedence over frontend-design for anything marketing-facing, because it carries the house constraints. For application UI use frontend-design; for a published Artifact use artifact-design.
---

This skill is the house style for web/UI design work. Follow the two hard rules first; everything else is the look distilled from the reference library in `references/`.

## Hard rules — non-negotiable

### 1. No outline borders on containers
Never frame cards, panels, sections, hero boxes or media in a 1–3px outline border. That bordered-box-everywhere look is the tell to avoid. Separate and group content with **whitespace, background fills, soft shadows, photo bands and colour blocks** instead.

The only lines allowed are deliberate *design devices*, used sparingly, never as a frame around every box:
- a single hairline rule under an eyebrow label or between list rows (see Cortex `/01 /02` rows, AcreFlow FAQ);
- a faint blueprint grid used as intentional texture (Cortex);
- a thin divider separating stat columns (PADRA trust row).

When tempted to add a border, reach for one of these instead:
- **Fill** — give the card a subtly different background (`#fff` card on `#f5f5f4` section, or vice-versa).
- **Shadow** — soft, low, large-radius (`0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)`), never a hard drop shadow.
- **Space** — increase the gap; let air do the separating.
- **Colour block** — a solid tinted rectangle behind or beside the content (furniture site, Bridgeway green CTA).
- **Radius** — consistent corner radius reads as "a card" without an outline.

### 2. Material Design typefaces only (unless asked)
Default to the **Roboto superfamily** plus Material Symbols. Only use other fonts if the user explicitly asks for them.

| Role | Typeface |
|---|---|
| Editorial / display headings | **Roboto Serif** or **Roboto Slab** |
| Modern / technical headings + body + UI | **Roboto Flex** (or plain **Roboto**) |
| Eyebrows, labels, mono accents, code | **Roboto Mono** |
| Icons | **Material Symbols** (Rounded or Outlined) |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,300..800&family=Roboto+Serif:opsz,wght@8..144,300..700&family=Roboto+Mono:wght@400;500&family=Roboto+Slab:wght@300..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet">
```

The references include heavy serif editorial work (Bridgeway, furniture site) — recreate that with **Roboto Serif/Slab**, which stays inside the Material constraint.

## The look (distilled from the references)

Each principle below is shown in `references/`. Aim for *intentional* — pick a direction and execute it cleanly.

1. **Confident, large type.** Display headings dominate the hero. Tight leading, generous size. Mix roman + italic in serif headings for editorial warmth (Bridgeway).
2. **Restrained palette.** One dominant colour + one or two accents. Never a rainbow. Examples: warm amber + mustard + teal (furniture); near-black + electric blue (Cortex); white + fresh green (AcreFlow); deep institutional green (PADRA); black/white + forest green (Bridgeway).
3. **Eyebrow label system.** Small, uppercase, letter-spaced labels marking each section — often prefixed with a dot (`• About Us`, AcreFlow), `//` (`// About`, PADRA/Cortex), or set in Roboto Mono. This is the workhorse for hierarchy without borders.
4. **Real content, not filler.** Photography and genuine product/data imagery carry the page. Layer solid colour rectangles behind/offset from photos (furniture) for depth.
5. **Generous whitespace + clear vertical rhythm.** Big gaps between sections do the separating that borders otherwise would.
6. **Pill badges + button pairs.** A pill announcement badge in the hero; a filled primary + ghost/outline-text secondary CTA side by side.
7. **Social proof blocks.** Stat rows (`40%` / `48+` / `64%` with mono captions) and muted grayscale logo walls.
8. **Asymmetry & layering.** Offset images, diagonal flow, grid-breaking blocks, staggered galleries — not centred symmetrical stacks.
9. **Soft, low shadows + medium radius** for anything card-like. Dark themes use a coloured gradient bloom (Cortex blue glow) rather than flat black.

## Section patterns (build these border-free)

- **Hero** — full-bleed photo or colour field, large heading, sub-line, pill badge above, filled + ghost CTA pair below; optional trust/stat strip at the bottom edge.
- **Eyebrow + heading** — mono/uppercase label, then the display heading; a single hairline rule under the label is fine.
- **Feature cards** — different background fill from the section + soft shadow + radius; line icon, title, copy, `Explore →` text link. No outline.
- **Stat row** — large numbers, mono captions, separated by space or a single vertical hairline divider, often over a thin photo band.
- **Logo wall** — muted/grayscale logos on a tinted band, even spacing.
- **FAQ** — accordion; rows separated by a single hairline divider, `+`/`–` affordance, no boxes.
- **Testimonial** — quote, star row, avatar + name; carousel dots. Card = fill + shadow, not border.
- **CTA band** — full-width solid colour block (deep green works across the refs) with centred heading + buttons.
- **Footer** — dark band, multi-column links, mono micro-labels.

## Before-you-ship checklist
- [ ] No container has an outline border (cards separated by fill / shadow / space / colour block).
- [ ] Only Material typefaces used (Roboto family + Material Symbols), unless the user asked otherwise.
- [ ] One dominant colour + ≤2 accents.
- [ ] Eyebrow labels present and consistent.
- [ ] Shadows are soft and low; radius is consistent.
- [ ] Real imagery / data, layered for depth — not flat filler.
- [ ] Hero has heading + sub + CTA pair; page has a stat row and/or logo wall for proof.
- [ ] No purple-gradient-on-white, no centred-symmetrical-stack default, no bordered-card grid.

## References
See `references/` for the five source designs and `references/REFERENCES.md` for a breakdown of what to borrow from each.
