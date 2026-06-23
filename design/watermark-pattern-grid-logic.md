# Watermark Pattern Grid Logic

Use this note before building or changing EasyQuest-style background watermarks.

## Rule

Do not place watermark icons by eye. Build a visible pattern grid first, then attach every icon to a grid center.

## Current Pattern

- Base artboard: `390 x 844`.
- Grid columns: `6`, including off-screen columns so edge icons are clipped.
- Grid rows: `14`.
- Horizontal step: `104`.
- Vertical step: `72`.
- Row A start: `x = -44`.
- Row B start: `x = 8`.
- Row B shift: `52`, exactly half of the horizontal step.
- Icon rotation: `-12deg`.
- Debug mode: add `?watermarkGrid=1` to the local URL.

## Important Lesson

Lines and center points are not enough. The icons must be rendered in the same coordinate system as the debug grid.

In `AppScreen.tsx`, PNG watermarks are scaled from the same `390 x 844` grid as the SVG debug overlay:

- `left = centerX * scaleX - size / 2`
- `top = centerY * scaleY - size / 2`
- `size = baseSize * iconScale`

SVG watermarks and the debug overlay both use:

- `viewBox="0 0 390 844"`
- `preserveAspectRatio="none"`

If icons still look shifted after this, the issue is usually transparent padding inside the source PNG. Fix it with per-icon offsets or by trimming the asset, not by moving random grid points.

## Icon Asset Requirements

Prepare watermark icons as centered, square assets. The grid attaches each icon to a center point, so asset center must equal visual center.

Recommended source format:

- Prefer SVG for simple marks and silhouettes.
- PNG is acceptable only when it is trimmed and centered.
- Use transparent background.
- Use a square canvas: `256 x 256` or `512 x 512`.
- Keep the visible silhouette centered on canvas center.
- Keep equal transparent padding on all sides.
- Target visible silhouette should occupy about `72-82%` of the square canvas.
- Avoid large empty transparent padding baked into the PNG.
- Avoid off-center shadows, glows, labels, highlights, or baked background.
- Use a single clear silhouette. Fine detail is wasted because opacity is low.

Current rendered target sizes in `AppScreen.tsx`:

- `bally`: `66`
- `open chest`: `66`
- `chest`: `64`
- `compass`: `62`
- `coin`: `58`
- SVG `pig`: scale `0.56` from `120 x 120`
- SVG `gamepad`: scale `0.56` from `120 x 120`
- SVG `flame`: scale `0.43` from its path bounds

For a new PNG icon:

1. Start with a `256 x 256` transparent canvas.
2. Put the visual center exactly at `(128, 128)`.
3. Keep the silhouette inside roughly `34-222` on both axes.
4. Export PNG without extra transparent border.
5. Add it to `IMG_SRC`.
6. Add a target size to `ICON_SIZE`, usually `60-66`.
7. Open `?watermarkGrid=1` and check the visible center against the dot.

For a new SVG icon:

1. Draw inside a normalized `120 x 120` viewBox.
2. Keep the visual center around `(60, 60)`.
3. Keep the silhouette inside roughly `18-102` on both axes.
4. Render it with a `G` transform using the grid center: `translate(cx cy) rotate(rot) scale(...) translate(-60 -60)`.
5. Use only `WMARK_TINT` plus low-opacity background cutouts if needed.

## Layered Watermark Icon Requirements

Use this style for icons that must preserve internal details, such as the coin or flame. Do not use `tintColor` PNG for these icons because it flattens all internal detail.

Recommended structure:

1. Outer silhouette: `fill={WMARK_TINT}`, opacity around `OP`.
2. Light internal detail: `fill` or `stroke` using `#ECEEF6`, opacity around `0.18-0.42`.
3. Dark internal detail: `fill={WMARK_TINT}`, opacity around `OP * 0.55` to `OP * 0.9`.
4. No bright colors, no gradients, no hard shadows, no glossy highlights.
5. Internal detail should read at normal mobile size, but only as a soft watermark.

Layer rules:

- The outer silhouette is the strongest layer, but still low opacity.
- Light internal detail should feel like a cutout or emboss, not white decoration.
- Dark internal detail should be weaker than the outer silhouette unless it is a tiny hole/dot.
- Avoid large dark strokes inside the icon; they become too contrasty.
- Avoid decorative highlights unless the user explicitly asks for them. The coin highlight was removed because it made the watermark look like a foreground object.

Current examples:

- Coin:
  - outer circle: `WMARK_TINT` at `OP`
  - inner ring: light `#ECEEF6`
  - diamond: light `#ECEEF6`
  - center hole: dark `WMARK_TINT` at low opacity
- Flame:
  - outer flame: `WMARK_TINT` at `OP`
  - first inner flame: light `#ECEEF6`
  - central flame: dark `WMARK_TINT`, calibrated slightly lower/right by hand

For a new layered SVG watermark:

1. Start in a `120 x 120` coordinate system.
2. Put the outer shape visually centered at `(60, 60)`.
3. Keep the outer shape inside roughly `12-108`.
4. Add one light internal shape if the original icon has a secondary area.
5. Add one dark internal shape only if the original icon has a hole, core, or important center mark.
6. Place internal shapes by visual center, not mathematical path center.
7. Test on the real screen without debug lines first.
8. Then open `?watermarkGrid=1` and confirm the outer silhouette still sits on the grid center.

Calibration checklist:

- If the icon pops out too much, reduce internal stroke/fill opacity first.
- If a detail disappears, increase only that detail, not the whole icon.
- If a detail looks wrong, move that inner path, not the outer silhouette.
- If the icon feels heavier than nearby icons, reduce scale or opacity.
- Keep per-icon adjustments small and document them in this file if they become permanent.

If an icon is visually off-center but the asset cannot be changed, use a per-icon offset:

- `offsetX`: positive moves right, negative moves left.
- `offsetY`: positive moves down, negative moves up.
- Keep offsets small, usually within `-6..6`.
- Document the reason beside the offset.

## Visual Balance Rules

Icons in the pattern should have similar visual mass. A mathematically equal size is not enough.

- Round icons often look larger than angular icons; render them slightly smaller.
- Wide icons like gamepads or pig heads may need a smaller width or a vertical offset.
- Detailed icons should be simplified or used less often.
- Do not mix many large round shapes in one row; they read as random circles instead of a game pattern.
- Prefer repeating a few strong silhouettes over using every available icon equally.

## Workflow Next Time

1. Open the screen with `?watermarkGrid=1`.
2. Check that every icon visually sits on a center dot.
3. If a specific icon looks off-center, add a per-icon offset or trim the asset.
4. Only after the grid alignment is correct, hide the debug overlay and judge the final background.
