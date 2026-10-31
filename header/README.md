# Murmuration header

`murmuration.html` is the live simulation: a few thousand starlings flock, gather
into "Jamie Parr", hold it, then break apart again. GitHub READMEs can't run
JavaScript, so the header is rendered to two animated images, one per GitHub
theme, and the README picks the right one with a `<picture>` tag. Both have a
transparent background, so they sit on the page with no visible edge.

## Make the images

Run from the repo root. Each render takes a few minutes.

1. Install the renderer's only dependency (Playwright, the same tool the portfolio
   tests use) and a Chromium build for it. Skip this if `node_modules` exists.

   ```bash
   npm i -D playwright
   ```

   ```bash
   npx playwright install chromium
   ```

2. Render one loop (22 s) for each theme. Frames are captured at 2x, 30 fps, with
   a transparent background.

   ```bash
   node header/render.mjs --theme dark
   ```

   ```bash
   node header/render.mjs --theme light
   ```

3. Scale the frames down and join them into animated WebPs. Needs ffmpeg
   (`winget install ffmpeg`). The `premultiply`/`unpremultiply` pair stops the
   bird edges picking up dark fringes when scaled, and `lutrgb` rounds the
   transparency to 16 levels, which halves the file size with no visible change.
   Each one takes about ten seconds.

   ```bash
   ffmpeg -y -framerate 30 -i header/frames-dark/%04d.png -vf "premultiply=inplace=1,scale=900:300:flags=lanczos,unpremultiply=inplace=1,format=rgba,lutrgb=a='round(val/17)*17'" -pix_fmt bgra -loop 0 -c:v libwebp_anim -q:v 85 -compression_level 4 header/murmuration-dark.webp
   ```

   ```bash
   ffmpeg -y -framerate 30 -i header/frames-light/%04d.png -vf "premultiply=inplace=1,scale=900:300:flags=lanczos,unpremultiply=inplace=1,format=rgba,lutrgb=a='round(val/17)*17'" -pix_fmt bgra -loop 0 -c:v libwebp_anim -q:v 85 -compression_level 4 header/murmuration-light.webp
   ```

4. Check the sizes: expect about 5 MB each. If one is much bigger, re-run step 2
   with `--fps 24`.

5. Delete the frame folders before committing; `.gitignore` already excludes them.

   ```bash
   Remove-Item header\frames-dark, header\frames-light -Recurse -Force
   ```

## Put it in the README

Replace the `<img ...>` (or `# Jamie Parr`) line at the top of `README.md` with:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="header/murmuration-dark.webp">
  <img src="header/murmuration-light.webp" alt="Jamie Parr" width="100%">
</picture>
```

GitHub shows the dark image to people using its dark theme and the light one to
everyone else. The image spells the name, so the heading isn't needed twice.

## Tweaking

Everything that matters is near the top of the `<script>` in `murmuration.html`:

- `NB`: number of birds (5200).
- `T`, `HOLD` and `phase()`: how long the flock flies free (9 s), gathers (4.5 s),
  holds the name (4 s) and releases (4.5 s).
- `anchor()`: how the flock is drawn toward the name's spot before gathering and
  after releasing, which keeps those transitions gentle.
- the fragment shader's `vec3` colours: bird colour near and far, per theme.
- `sampleText()`: the name, its font and size.

Open `murmuration.html` in a browser to see changes live (`?theme=light` for the
light version). It needs no build step.
