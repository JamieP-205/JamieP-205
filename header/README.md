# Murmuration header

`murmuration.html` is the live simulation: a few thousand starlings flock over the
Lagan, gather into "Jamie Parr", then break apart again. GitHub READMEs can't run
JavaScript, so the header is rendered once to an animated image and that image is
what the README embeds.

## Make the image

Run from the repo root.

1. Install the renderer's only dependency (Playwright, the same tool the portfolio
   tests use) and a Chromium build for it:

   ```bash
   npm i -D playwright
   ```

   ```bash
   npx playwright install chromium
   ```

2. Render one full loop (34 s) to PNG frames. 20 fps is a good balance; use
   `--fps 15` for a smaller file.

   ```bash
   node header/render.mjs
   ```

3. Join the frames into an animated WebP. Needs ffmpeg (`winget install ffmpeg`).

   ```bash
   ffmpeg -y -framerate 20 -i header/frames/%04d.png -loop 0 -c:v libwebp_anim -q:v 80 -compression_level 6 header/murmuration.webp
   ```

   If a viewer can't show animated WebP you want a GIF as well. It's bigger, but
   the grey-on-dark palette suits GIF's 256 colours:

   ```bash
   ffmpeg -y -framerate 20 -i header/frames/%04d.png -vf "split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 header/murmuration.gif
   ```

4. Check the size. GitHub shows images up to about 10 MB without trouble. If the
   WebP is bigger, re-run step 2 with `--fps 15` or step 3 with `-q:v 70`.

5. Delete `header/frames/` before committing; only the `.webp` (and `.gif` if you
   made one) belong in the repo.

## Put it in the README

Replace the `# Jamie Parr` line at the top of `README.md` with:

```html
<img src="header/murmuration.webp" alt="Jamie Parr" width="100%">
```

The image already spells the name, so the heading isn't needed twice. Keep the
rest of the README as it is.

## Tweaking

Everything that matters is near the top of the `<script>` in `murmuration.html`:

- `NB` — number of birds (5200).
- `T` and `phase()` — how long the flock flies free, gathers, holds the name and
  breaks apart (34 s total).
- the fragment shader's two `vec3` colours — bird colour near and far.
- `sampleText()` — the name, its font and size.

Open the file in a browser to see changes live; it needs no build step.
