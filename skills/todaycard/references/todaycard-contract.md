<!--
[INPUT]: 依赖 TodayCard app 源码、functions/api/cards.js Dify 代理、assets/patterns.md 图案规则、todaycard-single.html 模板资产和 todaycard.app 发布约束
[OUTPUT]: 对外提供 TodayCard 数据、Dify answers、视觉、交互、单文件模板、验证和部署契约
[POS]: skills/todaycard 的细节参考，供需要修改实现或发布流程时读取
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# TodayCard Contract

## Product

TodayCard is a one-page decision tool:

1. User enters one decision.
2. App uses provided options or auto-generates four options.
3. Each option becomes one card.
4. User drags or scrolls the stack, chooses a card, then click/tap flips it.
5. Revealed card shows the option as the answer.

Initial page load must render local default cards only. Dify calls are allowed only after an explicit user action: clicking the build button or pressing Enter in the decision input.

Default options should stay action-shaped:

- `现在推进...`
- `暂时不做`
- `问一个人再定`
- `只试 30 分钟`

Dify-generated options must also stay action-shaped. The workflow should return a structured `answers` array with exactly four short strings.

## Data

Card data owns:

- `id`: stable `TC.xxxxx`
- `index`
- `option`
- `signature`
- `date`: `MM/DD`
- `seed`
- `paletteIndex`
- `grid`

Seed source is `decision + option + index`. Random-looking output must be reproducible for the same input.

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
- Horizontal mirroring is allowed.
- Vertical flipping is not allowed because it damages directional shapes.

Use `assets/patterns.md` as the copyable preset source.

## Single HTML

Use `assets/todaycard-single.html` when the requested deliverable is a single copyable HTML file.

- It must contain inline CSS and inline JavaScript.
- It must not reference `styles.css`, `app.js`, or any external runtime.
- It is a template asset, not the split-source truth.
- When page structure, visual rules, interaction, card data, default copy, or frontend API boundaries change, update the split source first, then refresh this asset in the same change.
- If the split source and this single HTML asset cannot express the same behavior cleanly, stop and ask before choosing a compromise.

## Interaction

- Pointer flow is the click/tap truth source.
- Click a card: focus it and flip it.
- Click empty deck: flip focused card.
- Drag beyond threshold: move focus, do not flip.
- Keyboard: ArrowLeft/ArrowRight move focus, Enter/Space flip.
- Flip by adding `.is-flipped` to the existing DOM node; do not rerender to fake animation.
- On mobile WebKit, keep card faces separated with `translateZ` and explicit `-webkit-*` 3D/backface rules so the hidden face cannot leak mirrored text.

## Deployment

The repository may contain skill and architecture files, but the public site should not.

Use `npm run build` to copy only these files into `dist/`:

- `index.html`
- `styles.css`
- `app.js`

Cloudflare Pages should publish `dist`.
