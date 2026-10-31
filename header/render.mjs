// Renders murmuration.html to a folder of PNG frames (one full loop, transparent
// background) so ffmpeg can turn them into the animated image the README embeds.
//
//   node header/render.mjs                  -> header/frames-dark/0000.png ...
//   node header/render.mjs --theme light    -> header/frames-light/...
//   node header/render.mjs --fps 24         -> fewer frames, smaller file
//
// Frames are captured at 2x and scaled down by ffmpeg, which gives the smooth
// bird edges that the headless browser's software renderer can't do itself.
//
// Needs Playwright:  npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const theme = arg('theme', 'dark');
const fps = Number(arg('fps', 30));
const scale = Number(arg('scale', 2));
const width = Number(arg('width', 900));
const height = Number(arg('height', 300));
const out = join(here, `frames-${theme}`);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
await page.goto(pathToFileURL(join(here, 'murmuration.html')).href + `?render&theme=${theme}`);
await page.waitForFunction(() => typeof window.render === 'function');

// Start the loop just after the flock has formed the name: every bird is at a
// fixed letter position there, so the last frame joins the first without a cut.
const cycle = await page.evaluate(() => window.cycle);
await page.evaluate((s) => window.seek(s), (await page.evaluate(() => window.holdStart)) + 0.5);

const frames = Math.round(cycle * fps);
const canvas = page.locator('#wrap');
for (let i = 0; i < frames; i++) {
  await page.evaluate((dt) => window.render(dt), 1 / fps);
  await canvas.screenshot({ path: join(out, String(i).padStart(4, '0') + '.png'), omitBackground: true });
  if (i % 100 === 0) console.log(`${i}/${frames}`);
}
await browser.close();
console.log(`wrote ${frames} frames (${width * scale}x${height * scale}, ${theme}) to ${out}`);
