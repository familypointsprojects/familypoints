# easyQuest Mascot Assets

Use the final transparent PNG files in the app:

- `easyquest-mascot-main.png` — default helper / hero block
- `easyquest-mascot-xp-card.png` — level/XP hero block, mascot holding an experience card
- `easyquest-mascot-celebrate.png` — task completed, reward received, level up
- `easyquest-mascot-helper.png` — tips, info cards, pointing at UI
- `easyquest-mascot-savings.png` — piggy bank, coins, savings/growth missions
- `easyquest-mascot-flat-pirate.png` — fixed funny pirate character; use as the canonical reference for new pirate poses and emotions
- `easyquest-rocket.png` — rocket icon for XP progress bars
- `easyquest-rocket-no-flame.svg` — rocket icon for XP bars where the progress fill itself acts as the flame trail

Reference/working files:

- `*-key.png` files are chroma-key source images. Do not use them in the app.
- `easyquest-mascot-preview.png` is a contact sheet for quick review.

Format rule:

- Use transparent PNG/WebP for the full mascot illustrations.
- Use SVG only for simple UI icons, the coin, compass, progress rocket, and mini mascot marks.
- Do not place mascot images with baked backgrounds over cards or popups.

Pirate variations:

- Use the Codex skill `easyquest-flat-pirate` for new pose/emotion variants.
- Keep the flat sticker style, brighter reference palette, red beard, orange nose, charcoal hat/coat, olive pants, feather accent, and visible wooden peg leg.
- Current fixed variants live in `pirate-variants/`; app-ready 256px copies live in `assets/images/pirate-variants/`.
