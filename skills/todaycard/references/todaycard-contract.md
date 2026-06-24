<!--
[INPUT]: 依赖用户提供的决策信息、TodayCard 产品规则、内联声音层、Dify answers 代理语义、assets/patterns.md 图案规则、assets/og.png 社交预览图、todaycard-single.html 模板资产、install-check.md 安装查漏协议和 todaycard.app 线上入口
[OUTPUT]: 对外提供 TodayCard 4 个答案生成规则、网页端 App 提示、数据、Dify answers、视觉、交互、声音、SEO 公开元信息、单文件模板和安装完整性契约
[POS]: skills/todaycard 的细节参考，供需要运行 skill、生成答案或维护模板时读取
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# TodayCard Contract

## Product

TodayCard is a one-page decision tool:

1. User enters one decision.
2. App auto-generates four action-shaped options from Dify or local logic.
3. Each option becomes one card.
4. Clicking the draw button starts the draw sound, builds cards, and deals them into the coverflow one by one.
5. User drags or scrolls the stack, chooses a card, then click/tap flips it.
6. Revealed card shows the option as the answer with a Hero Moment sound.

Initial page load must render local default cards only. Dify calls are allowed only after an explicit user action: clicking the build button or pressing Enter in the decision input.

Default options should stay action-shaped:

- `现在推进...`
- `暂时不做`
- `问一个人再定`
- `只试 30 分钟`

Dify-generated options must also stay action-shaped. The workflow should return a structured `answers` array with exactly four short strings.

## Skill Run

When the skill itself is run, it should behave like a product ritual:

1. Accept the decision or context the user already provided.
2. If no decision is present, ask only: `今天想决定什么？`
3. Generate exactly four answers labeled `Choice A-D`.
4. Keep answers short, concrete, and action-shaped.
5. End with the live app note: `网页端 App 已上线：https://todaycard.app/，手机浏览器也可以直接打开抽卡。`

The four answers should cover different useful directions:

- act now
- wait or decline
- ask someone
- run a small test

## Data

Card data owns:

- `id`: stable `TC.xxxxx`
- `index`
- `option`
- `choiceLabel`: fixed `Choice A-D`
- `date`: `MM/DD`
- `seed`
- `paletteIndex`
- `grid`

Seed source is `decision + option + index`. Random-looking output must be reproducible for the same input.

## Palette

The card data layer owns the palette pool.

- Palettes should stay youthful, cute, high-saturation candy colors: clean enough to feel light, with mark/frame colors boosted roughly 20% beyond the previous vivid palette while the white paper face keeps the interface calm.
- Low-lightness, dirty, muddy, bronze, clay, or grayish colors do not belong in the palette.
- Each palette entry must declare a `family`.
- One draw must not reuse the same palette family across cards.
- Assign colors by shuffling palette families from a deck seed, then taking one palette from each selected family.

## Dify

Browser code must call only `/api/cards`.

`functions/api/cards.js` owns:

- Reading `DIFY_API_KEY`.
- Calling Dify Workflow API.
- Returning `{ "answers": [...] }`.
- Falling back to an error response instead of exposing upstream details.

Cloudflare environment variables:

- `DIFY_API_KEY`
- `DIFY_API_BASE_URL`
- `DIFY_WORKFLOW_ID` (optional; omit it for Dify app API `/workflows/run`)
- `DIFY_INPUT_NAME`
- `DIFY_OUTPUT_NAME`

## Grid

Grid is always 10x10.

- Presets use `#` for filled cells and `.` for empty cells.
- Presets must stay readable at card size.
- Presets must be concrete cute symbols such as heart, smile, star, question, arrow, flower, moon, clover, ribbon, crown, gift, music, sun, lollipop, balloon, and check.
- Abstract geometry does not belong in `GRID_PRESETS`.
- Horizontal mirroring is allowed.
- Vertical flipping is not allowed because it damages directional shapes.
- The default face must keep the original 10x10 grid: `#` cells are solid color blocks and `.` cells are pale visible cells.
- The answer face must reuse the same `card.grid`, but render only filled `#` cells as solid color blocks; empty `.` cells are layout space.
- The answer face must reserve a two-line answer text area so short and long answers keep the same visual weight.

Use `assets/patterns.md` as the copyable preset source.

`GRID_PRESETS` in the source or single HTML template must stay in sync with `assets/patterns.md`.

## SEO

The public product URL is `https://todaycard.app/`.

- The public page owns title, description, canonical, hreflang, robots meta, Open Graph, Twitter Card, manifest link, and JSON-LD.
- `assets/og.png` owns the 1200x630 imagegen social preview image.
- `robots.txt` must allow the public site and point to `https://todaycard.app/sitemap.xml`.
- `sitemap.xml` must list only the canonical homepage until real additional public pages exist.
- `site.webmanifest` must keep the product name, theme color, and SVG icon aligned with the head metadata.
- `skills/todaycard/assets/todaycard-single.html` must carry equivalent SEO metadata for the TodayCard template without external CSS or JavaScript.

## Run Entry

`https://todaycard.app/` is the production app path. Use it when the user wants to try TodayCard, share it, or compare live behavior.

This live path does not prove a local skill install is complete. If install files, templates, or package paths are in doubt, run `install-check.md` first.

## Single HTML

Use `assets/todaycard-single.html` when the requested deliverable is a single copyable HTML file.

- It must contain inline CSS and inline JavaScript.
- It must not reference `styles.css`, `audio.js`, `app.js`, or any external runtime.
- It accepts optional `window.TodayCardPreload = { decision, answers }` before the final runtime script.
- A generated preview should copy the template, inject `TodayCardPreload`, then open the copied HTML file.
- It may reference `https://todaycard.app/` canonical, manifest, and social image metadata because those are publication hints, not runtime dependencies.
- It is a template asset, not the split-source truth.
- When page structure, visual rules, interaction, card data, default copy, SEO metadata, or frontend API boundaries change, keep the single HTML asset behavior aligned.
- If the source page and this single HTML asset cannot express the same behavior cleanly, stop and ask before choosing a compromise.

## Interaction

- Pointer flow is the click/tap truth source.
- On mobile, the page must behave as a one-screen app shell: no document scroll, no vertical scrollbar, and no rubber-band handoff from the deck to the page.
- On mobile, the deck owns touch gestures with `touch-action: none` plus pointer-level default prevention; vertical movement inside the deck must not compete with browser scrolling.
- On mobile, the full-bleed stage must derive from the app gutters, not nested `100vw` escape math; the deck center and input center must share the same axis in iOS Safari.
- Coverflow position is circular: `Choice A` has `Choice D` on its left and `Choice B` on its right, so first/last cards do not create a one-sided edge.
- Draw button starts the card ritual: play draw-start sound, request/generate answers, render new cards, then deal all cards with a fixed stagger.
- During dealing, card drag and flip are disabled.
- Dealing animation must use the `.deal-motion` wrapper; do not animate the outer `.card` coverflow transform.
- Click/tap the focused card: flip it.
- Click/tap a non-focused card, or the left/right area outside the focused card: move focus only, do not flip.
- Drag beyond threshold: move focus, do not flip, play a light deck-shift sound, and trigger haptic vibration when supported.
- Successful flip should trigger a light haptic vibration when supported.
- Keyboard: ArrowLeft/ArrowRight move focus, Enter/Space flip.
- Flip by adding `.is-flipped` to the existing DOM node; do not rerender to fake animation.
- On mobile WebKit, keep card faces separated with `translateZ` and explicit `-webkit-*` 3D/backface rules so the hidden face cannot leak mirrored text.

## Sound

The inline sound layer owns all Web Audio synthesis.

- Draw start: short 8-bit charge.
- Deal card: paper snap plus arcade tick, one per card.
- Deck shift: short paper tick plus tiny pitch sweep.
- Flip reveal: Hero Moment arpeggio plus sparkle tail.

The inline behavior layer may trigger sound events, but sound must not enter card data, seeds, Dify payloads, or render HTML.

## Install Integrity

Use `install-check.md` for any TodayCard skill install or missing-file concern.

- `npx skills@latest add . --list` should find exactly one skill: `todaycard`.
- A usable skill package must include `SKILL.md`, `agents/openai.yaml`, `assets/patterns.md`, `assets/todaycard-single.html`, `references/install-check.md`, and `references/todaycard-contract.md`.
- Missing machine assets are fixed by reinstalling, cloning, or syncing from GitHub, not by inventing placeholders.
