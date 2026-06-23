<!--
[INPUT]: 依赖 TodayCard app 源码、assets/patterns.md 图案规则、todaycard-single.html 模板资产和 todaycard.app 发布约束
[OUTPUT]: 对外提供 TodayCard 数据、视觉、交互、单文件模板、验证和部署契约
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

Default options should stay action-shaped:

- `现在推进...`
- `暂时不做`
- `问一个人再定`
- `只试 30 分钟`

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
- When app behavior changes, update the split source first, then refresh this asset.

## Interaction

- Pointer flow is the click/tap truth source.
- Click a card: focus it and flip it.
- Click empty deck: flip focused card.
- Drag beyond threshold: move focus, do not flip.
- Keyboard: ArrowLeft/ArrowRight move focus, Enter/Space flip.
- Flip by adding `.is-flipped` to the existing DOM node; do not rerender to fake animation.

## Deployment

The repository may contain skill and architecture files, but the public site should not.

Use `npm run build` to copy only these files into `dist/`:

- `index.html`
- `styles.css`
- `app.js`

Cloudflare Pages should publish `dist`.
