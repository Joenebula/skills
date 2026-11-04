/**
 * NO TEXT FIELD MAKES THE iPHONE ZOOM — a measure for Playwright. From Vibe HQ
 * (rule M12, e2e/support/measure.ts and e2e/storybook/field-zoom.storybook.ts,
 * #85, 2026-11-04).
 *
 * Safari on the iPhone zooms the page in when a text field under 16px gets
 * focus, and does not zoom back out. kit/mobile.css holds every field at 16px
 * with a finger; this proves it.
 *
 * Touch only: with a mouse there is no zoom, so it returns nothing. Every text
 * field, shown or not: a hidden one zooms too once it shows.
 *
 * Use in a test that visits each page or story on the phone projects:
 *   for (const f of await measureFieldZoom(page)) found.push({ ...f, where: url });
 *   expect(found).toEqual([]);
 *
 * ⚠ TWO TRAPS SEEN IN CI.
 *  1. "Finished drawing" can come before a page adds its fields (counted 86 of
 *     100). Before measuring, wait until the field count holds — fieldCountSettled().
 *  2. Guard against a page that measures nothing: also assert a minimum field
 *     count across the run, so an empty or half-built build cannot pass.
 *
 * Prove it can fail before trusting it: take the 16px rule out of the built CSS
 * and the check must name the fields.
 */
import type { Page } from '@playwright/test';

export type Finding = { rule: string; where: string; detail: string };

export const TEXT_FIELDS =
  'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]):not([type=hidden]), textarea, select';

/** Count fields until the number holds three times, 100ms apart (at most 5s). */
export async function fieldCountSettled(page: Page): Promise<number> {
  let n = -1;
  for (let same = 0, t = 0; same < 3 && t < 50; t++) {
    await page.waitForTimeout(100);
    const now = await page.locator(TEXT_FIELDS).count();
    same = now === n ? same + 1 : 0;
    n = now;
  }
  return n;
}

export async function measureFieldZoom(page: Page): Promise<Finding[]> {
  return page.evaluate((sel) => {
    if (!matchMedia('(pointer: coarse)').matches) return [];
    const out: { rule: string; where: string; detail: string }[] = [];
    for (const el of document.querySelectorAll(sel)) {
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px >= 16) continue;
      const cls = [...el.classList].slice(0, 3).join('.');
      out.push({
        rule: 'field zoom',
        where: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`,
        detail: `text ${px}px, under 16: the iPhone zooms in when it is tapped`,
      });
    }
    return out;
  }, TEXT_FIELDS);
}
