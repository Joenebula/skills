/**
 * THREE DEVICES — the `projects` block for a Playwright config. From Vibe HQ
 * (playwright.storybook.config.ts, #82, 2026-11-04).
 *
 * Every check runs on a desktop with a mouse, and again on two phones with a
 * finger: Android (Chrome's engine, Blink) and iPhone (Safari's engine, WebKit;
 * every browser on an iPhone uses it). The same CSS can pass in one engine and
 * break in the other; only running it shows that. These are emulated devices,
 * not real phones: a real-device pass (BrowserStack or a phone in hand) is still
 * worth doing before a launch.
 *
 * Install both engines (CI too):  npx playwright install chromium webkit --with-deps
 *
 * ⚠ CI TIME. In one job the phones run after the desktop: Vibe HQ's Storybook
 * step went from 12 to 34 minutes. Give the phones their own CI job, beside the
 * main one:  desktop job: --project=desktop · phone job: --project=android
 * --project=iphone. Whole CI went from 60 back to about 29 minutes.
 *
 * ⚠ THE iPHONE AND THE TAB KEY. Safari's Tab key skips links by default ("Press
 * Tab to highlight each item" is off), so a keyboard walk reports every link as
 * unreachable. Playwright's WebKit has no switch for it, and Option+Tab does not
 * help. Skip the keyboard walk on the iPhone; desktop and Android walk it.
 *
 * Use:  import { devices } from '@playwright/test'; … projects: threeDevices(...)
 */
import { devices, type Project } from '@playwright/test';

export function threeDevices(opts: {
  /** Test files that only make sense once (text, the same on every device). */
  desktopOnly?: RegExp;
  /** The keyboard (Tab) walk: not on the iPhone, see above. */
  keyboard?: RegExp;
} = {}): Project[] {
  const join = (...r: (RegExp | undefined)[]) => {
    const parts = r.filter(Boolean).map((x) => `(?:${x!.source})`);
    return parts.length ? new RegExp(parts.join('|')) : undefined;
  };
  return [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] }, testIgnore: join(opts.desktopOnly) },
    {
      name: 'iphone',
      use: { ...devices['iPhone 15'] },
      testIgnore: join(opts.desktopOnly, opts.keyboard),
    },
  ];
}
