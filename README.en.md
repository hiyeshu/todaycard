<p align="center">
  <img alt="TodayCard favicon" src="./assets/todaycard.svg" width="72" height="72">
</p>

<h1 align="center">TodayCard</h1>

<p align="center">
  <a href="./README.md">中文</a> · <strong>English</strong>
</p>

<p align="center">
  <img alt="TodayCard product preview" src="./assets/og.png">
</p>

TodayCard is a tiny AI decision-card app. Type one question, draw four seeded cards, and turn a vague hesitation into action-shaped options you can flip through.

The Chinese README is the primary entry. This English version is here for GitHub readers who want a quick project tour.

Live app: [todaycard.app](https://todaycard.app/)  
Source: [github.com/hiyeshu/todaycard](https://github.com/hiyeshu/todaycard)

## What It Does

- One-line input: ask only "What do you want to decide today?"
- AI answers with fallback: request `/api/cards` first, then fall back to local options if the API is unavailable.
- Seeded cards: `decision + option + index` controls repeatable colors, patterns, and labels.
- Playful draw flow: draw, staggered dealing, swipe through cards, and flip the focused card.
- Mobile-first shell: one viewport, full-bleed coverflow, and card gestures that do not fight page scrolling.

## Local Preview

No dependencies are required. The build only copies public site files into `dist/`.

```bash
npm run build
python3 -m http.server 4173 -d dist
```

Open `http://localhost:4173`. Local preview uses fallback options unless `/api/cards` is provided by a Cloudflare Pages Functions environment.

## Dify Integration

The frontend never stores a Dify API key. `functions/api/cards.js` is the server-side proxy and returns only `{ answers: string[] }`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DIFY_API_KEY` | None | Required Dify API key |
| `DIFY_API_BASE_URL` | `https://api.dify.ai/v1` | Dify API base URL |
| `DIFY_INPUT_NAME` | `query` | Workflow input field |
| `DIFY_OUTPUT_NAME` | `answers` | Workflow output field |
| `DIFY_WORKFLOW_ID` | Empty | Set only when using `/workflows/{id}/run` |
| `DIFY_USER` | `todaycard-web` | Dify user identifier |

## Deployment Boundary

Cloudflare Pages publishes `dist/`. Pages Functions are read from the root `functions/` directory.

```bash
npm run build
```

Only these site assets should be public: `index.html`, `styles.css`, `data.js`, `audio.js`, `app.js`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `assets/todaycard.svg`, and `assets/og.png`.

`skills/`, `CLAUDE.md`, `AGENTS.md`, references, and other agent-facing docs stay in the repository and should not be published as site assets.

## Skill Package

The repository root is the app. The installable skill lives under:

```text
skills/todaycard/
```

Install it with:

```bash
npx skills add hiyeshu/todaycard
```

Check local discovery:

```bash
npx skills@latest add . --list
```

The expected result is a single `todaycard` skill. If an install looks incomplete, follow `skills/todaycard/references/install-check.md` and verify `SKILL.md`, `agents/openai.yaml`, `assets/todaycard-single.html`, and `references/*`.

When the skill runs, it accepts a decision question, or asks "What do you want to decide today?", then generates four short `Choice A-D` answers.

After generating answers, tell users the web app is available at [todaycard.app](https://todaycard.app/), including on mobile browsers.

For local one-file previews, copy `skills/todaycard/assets/todaycard-single.html`, inject the decision and four answers through `window.TodayCardPreload`, then open the generated HTML. The skill package does not include standalone `data.js`, `audio.js`, or `app.js`; those are inlined in the single HTML asset.

## Project Layout

```text
.
├── README.md               # Primary Chinese README
├── README.en.md            # English README for GitHub readers
├── index.html              # Page shell and public SEO metadata
├── styles.css              # Visuals, mobile shell, coverflow, flip and deal animations
├── data.js                 # Palette, Choice A-D labels, and 10x10 patterns
├── audio.js                # Web Audio draw, deal, swipe, and flip sounds
├── app.js                  # Seeded card data, Dify fallback, and interaction state
├── functions/api/cards.js  # Dify proxy
├── assets/                 # Favicon, OG image, and pattern source
└── skills/todaycard/       # Installable Agent skill
```

## Development Rules

- If split source changes structure, visuals, interaction, data, or default copy, sync `skills/todaycard/assets/todaycard-single.html`.
- Dify only generates answers; seed, color, label, date, and flip state stay in `app.js`.
- `assets/patterns.md` is the semantic source for patterns, and `data.js` must stay isomorphic with it.
- One card set must not repeat color families or introduce muddy low-light colors.
- Architecture changes must update `CLAUDE.md` and `AGENTS.md` so code and documentation stay aligned.
