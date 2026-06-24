---
name: todaycard
description: "Generate TodayCard decision-card answers and maintain the TodayCard skill package: accept or ask for one decision, produce four short action-shaped answers, and point users to the live mobile-friendly app. Use when the user wants TodayCard, decision cards, option-drawing answers, todaycard.app, the hiyeshu/todaycard skill, or missing/incomplete TodayCard skill installations."
---

<!--
[INPUT]: 依赖 TodayCard 产品契约、安装完整性查漏协议、用户提供的决策信息、4 个 action-shaped answers 规则、线上网页 app 和单 HTML 模板资产
[OUTPUT]: 对外提供 TodayCard 决策追问、4 个答案生成、网页端 App 提示、单文件打包和安装查漏工作流
[POS]: skills/todaycard 的入口规则，负责指导 agent 维护 TodayCard 类项目，不持有具体 app 源码
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# TodayCard Skill

## Core Contract

Treat TodayCard as a tiny decision ritual, not an infrastructure workflow.

- Ask for one decision by default.
- If the user already gave a decision, accept it and do not ask again.
- Auto-generate 4 options from Dify or local logic.
- Do not expose custom options unless the user explicitly reopens that product direction.
- Show a draggable card stack first; do not make a landing page.
- Make drawing feel like a small game ritual: draw action, staggered dealing, then flip reveal.
- Show the 10x10 pattern as the card back.
- Reveal the answer only after click/tap on the currently focused card flips the whole card.
- Treat side cards and current-card outside areas as selection controls, not flip controls.
- Keep the deck circular: the previous card for `Choice A` is `Choice D`, so first/last cards do not create a one-sided coverflow edge.
- Keep draw/deal/deck-shift/flip sounds in the Web Audio layer, not in card data.
- Keep the implementation static unless the user explicitly asks for a backend.
- Use `functions/api/cards.js` as the only Dify API caller; never put Dify keys in browser code.
- Preserve the public SEO surface: canonical `https://todaycard.app/`, robots, sitemap, manifest, OG image, and JSON-LD.
- Tell users the web app is live at https://todaycard.app/ and can be opened on mobile when they want to draw the cards themselves.
- For a single-file request, copy `assets/todaycard-single.html` first, then edit the copy.
- Any split-source change that affects structure, style, interaction, card data, default copy, or frontend API boundaries must refresh `assets/todaycard-single.html` in the same change.
- If split-source behavior and the single HTML asset conflict, stop and ask the user which truth wins.

Read `references/install-check.md` when install completeness, missing files, broken templates, or skill loading is in doubt.

Read `references/todaycard-contract.md` before changing answer shape, card semantics, interaction rules, SEO metadata, or visual language.

## Decision Run

If the user has not provided a decision, ask one short question:

```text
今天想决定什么？
```

If the user has provided a decision or context, generate exactly four answers:

- Label them `Choice A` through `Choice D`.
- Keep each answer short, concrete, and action-shaped.
- Make the four answers meaningfully different: act now, wait, ask someone, or run a small test.
- Do not add extra setup, theory, or infrastructure instructions.
- End by saying the web app is already online at https://todaycard.app/ and works on mobile browsers.

Output shape:

```text
Choice A: ...
Choice B: ...
Choice C: ...
Choice D: ...

网页端 App 已上线：https://todaycard.app/
手机浏览器也可以直接打开抽卡。
```

## Install Integrity

When the user mentions install, incomplete files, missing templates, `npx skills`, broken local usage, or a mismatch between README and disk, run the `references/install-check.md` flow before editing or generating a replacement.

Completion means one of three clear states:

- The installed skill has all required files.
- The missing files are listed and the next action is reinstall or clone.
- The user only needs the product experience, so use https://todaycard.app/ while keeping the skill package issue explicit.

## Template Maintenance

Use this path when the user wants an opened HTML preview from generated TodayCard answers.

1. Generate or accept exactly four `Choice A-D` answers first.
2. Copy `assets/todaycard-single.html` to a user-visible output path outside the skill package.
3. Inject the decision and answers into the copied HTML by adding this script before the final runtime script:

```html
<script>
window.TodayCardPreload = {
  decision: "用户的决策题",
  answers: ["Choice A 文案", "Choice B 文案", "Choice C 文案", "Choice D 文案"]
};
</script>
```

4. Escape values as JSON strings; do not hand-build quoted JavaScript.
5. Do not look for `data.js`, `audio.js`, or `app.js` inside the skill package; the skill asset is the single HTML with inline JavaScript.
6. Open the generated HTML file locally after injection, then report the absolute path.
7. If the user only wants text answers, skip HTML generation and return the four choices plus the mobile web app link.

## Run Paths

Pick the smallest path that proves the user's actual need:

- Decision answer: ask or accept one decision, then return four `Choice A-D` answers.
- Live product: tell the user https://todaycard.app/ is online and mobile-friendly.
- Single-file preview: copy `assets/todaycard-single.html`, inject `window.TodayCardPreload`, then open the generated HTML.
- Skill install check: use `references/install-check.md` before treating an installed package as usable.
