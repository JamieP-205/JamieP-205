// Renders murmuration.html to a folder of PNG frames, one full loop, so ffmpeg can
// turn them into the animated image the README embeds.
//
//   node header/render.mjs            -> header/frames/0000.png ...
//   node header/render.mjs --fps 15   -> fewer frames, smaller file
//
// Needs Playwright:  npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const fps = arg('fps', 20);
const width = arg('width', 900);
const height = arg('height', 300);
const out = join(here, 'frames');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'murmuration.html')).href + '?render');
await page.waitForFunction(() => typeof window.render === 'function');

// Start the loop while the flock is holding the name: every bird is at a fixed
// letter position there, so the last frame joins the first without a visible cut.
const cycle = await page.evaluate(() => window.cycle);
await page.evaluate(() => window.seek(26));

const frames = Math.round(cycle * fps);
const canvas = page.locator('#wrap');
for (let i = 0; i < frames; i++) {
  await page.evaluate((dt) => window.render(dt), 1 / fps);
  await canvas.screenshot({ path: join(out, String(i).padStart(4, '0') + '.png'), omitBackground: false });
  if (i % 50 === 0) console.log(`${i}/${frames}`);
}
await browser.close();
console.log(`wrote ${frames} frames to ${out}`);
