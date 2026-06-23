/*
[INPUT]: 依赖 index.html 的控件节点、styles.css 的状态类、functions/api/cards.js 的 Dify 代理、assets/patterns.md 的 10x10 图案契约、用户输入 decision/options、当前日期和内置 seeded palette 规则
[OUTPUT]: 对外提供单句决策输入、Dify/本地候选选项、带品牌/署名/月日元信息的 TodayCard 数据、10x10 牌背预设图案、移动优先牌堆和点击/触摸翻牌行为
[POS]: 项目行为层，承接 TodayCard.app.v1 的最小数据真相源，驱动唯一网页但不持有视觉细节
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
*/
/* ------------------------------
   数据层: 稳定 seed, 不信裸随机
------------------------------ */
const PALETTES = [
  {
    name: 'meridian',
    bg: '#ffffff',
    cell: '#f3f3f3',
    mark: '#00c9a7',
    text: '#666666',
    muted: '#a4a4a4',
    frame: '#00c9a7'
  },
  {
    name: 'verdant',
    bg: '#ffffff',
    cell: '#f3f3f3',
    mark: '#5cd500',
    text: '#666666',
    muted: '#a4a4a4',
    frame: '#5cd500'
  },
  {
    name: 'aurora',
    bg: '#ffffff',
    cell: '#f3f3f3',
    mark: '#c6a0fd',
    text: '#666666',
    muted: '#a4a4a4',
    frame: '#c6a0fd'
  },
  {
    name: 'tidewater',
    bg: '#ffffff',
    cell: '#f3f3f3',
    mark: '#85e8d8',
    text: '#666666',
    muted: '#a4a4a4',
    frame: '#85e8d8'
  },
  {
    name: 'lumen',
    bg: '#ffffff',
    cell: '#f3f3f3',
    mark: '#295df6',
    text: '#666666',
    muted: '#a4a4a4',
    frame: '#295df6'
  },
  {
    name: 'cinder',
    bg: '#ffffff',
    cell: '#f4f0ee',
    mark: '#ff5f1f',
    text: '#5c514d',
    muted: '#a79b96',
    frame: '#ff5f1f'
  },
  {
    name: 'rose',
    bg: '#ffffff',
    cell: '#f6eff3',
    mark: '#e31b82',
    text: '#5c4f56',
    muted: '#ad9aa4',
    frame: '#e31b82'
  },
  {
    name: 'signal',
    bg: '#ffffff',
    cell: '#f7f2e3',
    mark: '#ffc400',
    text: '#5c563f',
    muted: '#a79f82',
    frame: '#ffc400'
  },
  {
    name: 'ember',
    bg: '#ffffff',
    cell: '#f7eeee',
    mark: '#e11937',
    text: '#5c4d50',
    muted: '#a9969a',
    frame: '#e11937'
  },
  {
    name: 'plum',
    bg: '#ffffff',
    cell: '#f1edf7',
    mark: '#6f35e8',
    text: '#514b5c',
    muted: '#9c94ad',
    frame: '#6f35e8'
  },
  {
    name: 'moss',
    bg: '#ffffff',
    cell: '#edf5ed',
    mark: '#159a5b',
    text: '#47584f',
    muted: '#879d90',
    frame: '#159a5b'
  },
  {
    name: 'ink',
    bg: '#ffffff',
    cell: '#eeeeef',
    mark: '#171717',
    text: '#555555',
    muted: '#9a9a9a',
    frame: '#171717'
  }
];

const DEFAULT_OPTIONS = [
  '现在做一个最小版本',
  '先不做，保留精力',
  '问一个可信的人',
  '只投入 30 分钟试验'
];

const AUTO_OPTION_COUNT = 4;
const CARD_BRAND = 'Todaycard.app';
const BUILD_LABEL = '抽一组卡';
const BUILDING_LABEL = '抽牌中';
const SIGNATURES = [
  'small proof',
  'soft bet',
  'quiet yes',
  'try today',
  'ask once',
  'light move',
  'one step',
  'clear no'
];

const GRID_PRESETS = [
  {
    name: 'spark',
    rows: [
      '....##....',
      '....##....',
      '...####...',
      '..######..',
      '##########',
      '##########',
      '..######..',
      '...####...',
      '....##....',
      '....##....'
    ]
  },
  {
    name: 'heart',
    rows: [
      '.##....##.',
      '####..####',
      '##########',
      '##########',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
      '....##....',
      '..........',
    ]
  },
  {
    name: 'question',
    rows: [
      '..######..',
      '.##....##.',
      '......##..',
      '.....##...',
      '....##....',
      '...##.....',
      '...##.....',
      '..........',
      '...##.....',
      '...##.....'
    ]
  },
  {
    name: 'arrow',
    rows: [
      '.....#....',
      '....##....',
      '...###....',
      '..####....',
      '.######...',
      '########..',
      '.######...',
      '..####....',
      '...###....',
      '....##....'
    ]
  },
  {
    name: 'bloom',
    rows: [
      '...####...',
      '..######..',
      '.##.##.##.',
      '###.##.###',
      '##########',
      '##########',
      '###.##.###',
      '.##.##.##.',
      '..######..',
      '...####...'
    ]
  },
  {
    name: 'orbit',
    rows: [
      '..######..',
      '.##....##.',
      '##..##..##',
      '#..####..#',
      '#.######.#',
      '#.######.#',
      '#..####..#',
      '##..##..##',
      '.##....##.',
      '..######..'
    ]
  },
  {
    name: 'gate',
    rows: [
      '##########',
      '#........#',
      '#.######.#',
      '#.#....#.#',
      '#.#.##.#.#',
      '#.#.##.#.#',
      '#.#....#.#',
      '#.######.#',
      '#........#',
      '##########'
    ]
  },
  {
    name: 'wave',
    rows: [
      '##........',
      '###.......',
      '.###......',
      '..###.....',
      '...###....',
      '....###...',
      '.....###..',
      '......###.',
      '.......###',
      '........##'
    ]
  }
];

const state = {
  decision: '',
  cards: [],
  focus: 0,
  revealed: new Set(),
  paletteShift: 0,
  requestId: 0,
  drag: {
    active: false,
    startX: 0,
    deltaX: 0,
    moved: false,
    cardIndex: null,
    frame: 0
  }
};

const els = {
  decisionInput: document.getElementById('decisionInput'),
  optionsInput: document.getElementById('optionsInput'),
  buildButton: document.getElementById('buildButton'),
  deckShell: document.getElementById('deckShell'),
  deck: document.getElementById('deck'),
  emptyState: document.getElementById('emptyState')
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOptions(raw) {
  const options = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return options.length ? options.slice(0, 8) : [];
}

function normalizeAnswerList(values) {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, AUTO_OPTION_COUNT);
}

function optionSuggestions(decision) {
  const clean = decision.trim() || '这件事';
  const object = clean.replace(/[?？。！!]/g, '').replace(/^今天要不要/, '').slice(0, 18) || '这件事';
  return [
    `现在推进${object}`,
    `暂时不做`,
    `问一个人再定`,
    `只试 30 分钟`
  ].slice(0, AUTO_OPTION_COUNT);
}

async function fetchGeneratedOptions(decision) {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: decision })
  });
  if (!response.ok) throw new Error('Dify answers failed');
  const data = await response.json();
  return normalizeAnswerList(Array.isArray(data.answers) ? data.answers : []);
}

async function optionsFor(decision, customOptions) {
  if (customOptions.length) return customOptions;
  try {
    const generated = await fetchGeneratedOptions(decision);
    if (generated.length) return generated;
  } catch {
    /* Dify is optional; local suggestions keep the card ritual usable. */
  }
  return optionSuggestions(decision);
}

function cardSeed(decision, option, index) {
  return hashString(`${decision}\n${option}\n${index + 1}`);
}

function currentDateStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function createCards(decision, options) {
  const date = currentDateStamp();
  return options.map((option, index) => {
    const seed = cardSeed(decision, option, index);
    const rng = createRng(seed);
    const paletteIndex = (Math.floor(rng() * PALETTES.length) + index * 3) % PALETTES.length;
    const signature = SIGNATURES[Math.floor(rng() * SIGNATURES.length)];
    return {
      id: `TC.${String((seed % 100000)).padStart(5, '0')}`,
      index,
      option,
      signature,
      date,
      seed,
      paletteIndex,
      grid: createGrid(createRng(seed ^ 0x9E3779B9))
    };
  });
}

/* ------------------------------
   图案层: 10x10 预设, seed 只负责选择
------------------------------ */
function parsePreset(rows) {
  return rows.map((row) => [...row].map((cell) => cell === '#'));
}

function flipGridX(grid) {
  return grid.map((row) => [...row].reverse());
}

function createGrid(rng) {
  let grid = parsePreset(GRID_PRESETS[Math.floor(rng() * GRID_PRESETS.length)].rows);
  if (rng() > 0.5) grid = flipGridX(grid);
  return grid;
}

/* ------------------------------
   视图层: 牌堆只展示状态
------------------------------ */
function paletteFor(card) {
  return PALETTES[(card.paletteIndex + state.paletteShift) % PALETTES.length];
}

function setCardPalette(node, palette) {
  node.style.setProperty('--card-bg', palette.bg);
  node.style.setProperty('--card-cell', palette.cell);
  node.style.setProperty('--card-mark', palette.mark);
  node.style.setProperty('--card-text', palette.text);
  node.style.setProperty('--card-muted', palette.muted);
  node.style.setProperty('--card-frame', palette.frame);
}

function gridHtml(grid) {
  return grid
    .flat()
    .map((on) => `<span class="cell${on ? ' is-on' : ''}"></span>`)
    .join('');
}

function cardHtml(card) {
  const flipped = state.revealed.has(card.index);
  return `
    <article class="card${flipped ? ' is-flipped' : ''}" data-index="${card.index}" aria-label="TodayCard ${card.index + 1}">
      <div class="card-inner">
        <div class="stamp-face card-back">
          <div class="card-top">
            <span class="card-title">${CARD_BRAND}</span>
            <span class="card-id">${card.id}</span>
          </div>
          <div class="grid" aria-hidden="true">${gridHtml(card.grid)}</div>
          <div class="card-bottom">
            <span class="card-signature">${card.signature}</span>
            <span class="card-date">${card.date}</span>
          </div>
        </div>
        <div class="stamp-face card-front">
          <div class="card-top">
            <span class="card-title">${CARD_BRAND}</span>
            <span class="card-id">${card.id}</span>
          </div>
          <div class="answer-mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="answer-copy">
            <span class="option-label">Answer</span>
            <p class="answer-text">${escapeHtml(card.option)}</p>
          </div>
          <div class="card-bottom">
            <span class="card-signature">${card.signature}</span>
            <span class="card-date">${card.date}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderCards() {
  els.deck.innerHTML = state.cards.map(cardHtml).join('');
  els.emptyState.hidden = state.cards.length > 0;
  els.deck.querySelectorAll('.card').forEach((node) => {
    const card = state.cards[Number(node.dataset.index)];
    setCardPalette(node, paletteFor(card));
  });
  layoutCards();
}

function layoutCards() {
  const dragOffset = state.drag.active ? state.drag.deltaX / 118 : 0;
  const spread = window.innerWidth < 520 ? 190 : 250;
  els.deck.querySelectorAll('.card').forEach((node) => {
    const index = Number(node.dataset.index);
    const offset = index - state.focus + dragOffset;
    const distance = Math.abs(offset);
    node.style.setProperty('--x', `${offset * spread}px`);
    node.style.setProperty('--z', `${distance === 0 ? 60 : -distance * 48}px`);
    node.style.setProperty('--ry', `${offset * -30}deg`);
    node.style.setProperty('--rz', `${offset * 1.4}deg`);
    node.style.setProperty('--scale', `${Math.max(0.68, 1 - distance * 0.1)}`);
    node.style.setProperty('--opacity', `${distance > 3 ? 0.18 : Math.max(0.32, 1 - distance * 0.15)}`);
    node.style.setProperty('--sat', `${distance < 0.5 ? 1 : 0.68}`);
    node.style.zIndex = String(100 - Math.round(distance * 10));
  });
}

function setBuilding(isBuilding) {
  els.buildButton.disabled = isBuilding;
  els.buildButton.textContent = isBuilding ? BUILDING_LABEL : BUILD_LABEL;
}

async function rebuild() {
  const decision = els.decisionInput.value.trim() || '今天要不要推进这个想法';
  const customOptions = normalizeOptions(els.optionsInput.value);
  const requestId = state.requestId + 1;
  state.requestId = requestId;
  setBuilding(true);
  try {
    const options = await optionsFor(decision, customOptions);
    if (requestId !== state.requestId) return;
    state.decision = decision;
    state.cards = createCards(decision, options);
    state.focus = clamp(state.focus, 0, Math.max(0, state.cards.length - 1));
    state.revealed = new Set();
    renderCards();
  } finally {
    if (requestId === state.requestId) setBuilding(false);
  }
}

function renderLocalDeck() {
  const decision = els.decisionInput.value.trim() || '今天要不要推进这个想法';
  const options = optionSuggestions(decision);
  state.decision = decision;
  state.cards = createCards(decision, options);
  state.focus = clamp(state.focus, 0, Math.max(0, state.cards.length - 1));
  state.revealed = new Set();
  renderCards();
}

function moveFocus(delta) {
  if (!state.cards.length) return;
  state.focus = clamp(state.focus + delta, 0, state.cards.length - 1);
  layoutCards();
}

function flipFocused() {
  const current = state.cards[state.focus];
  if (!current) return;
  flipCard(current.index);
}

function activateCard(index) {
  if (state.drag.moved) {
    state.drag.moved = false;
    return;
  }
  if (index !== state.focus) {
    state.focus = index;
    layoutCards();
  }
  requestAnimationFrame(() => flipCard(index));
}

function flipCard(index) {
  const card = state.cards[index];
  if (!card || state.revealed.has(index)) return;
  state.revealed.add(index);
  const node = els.deck.querySelector(`.card[data-index="${index}"]`);
  if (node) {
    node.classList.add('is-flipped');
  }
}

function onPointerDown(event) {
  const cardNode = event.target.closest('.card');
  state.drag.active = true;
  state.drag.startX = event.clientX;
  state.drag.deltaX = 0;
  state.drag.moved = false;
  state.drag.cardIndex = cardNode ? Number(cardNode.dataset.index) : null;
  els.deckShell.focus({ preventScroll: true });
  els.deckShell.classList.add('is-dragging');
  els.deckShell.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!state.drag.active) return;
  state.drag.deltaX = event.clientX - state.drag.startX;
  state.drag.moved = Math.abs(state.drag.deltaX) > 8;
  if (!state.drag.frame) {
    state.drag.frame = requestAnimationFrame(() => {
      state.drag.frame = 0;
      layoutCards();
    });
  }
}

function onPointerUp(event) {
  if (!state.drag.active) return;
  const steps = Math.round(-state.drag.deltaX / 118);
  state.drag.active = false;
  if (state.drag.frame) {
    cancelAnimationFrame(state.drag.frame);
    state.drag.frame = 0;
  }
  els.deckShell.classList.remove('is-dragging');
  try {
    els.deckShell.releasePointerCapture(event.pointerId);
  } catch {
    /* releasePointerCapture can already be cleared by the browser */
  }
  if (state.drag.moved) {
    moveFocus(steps);
  } else if (state.drag.cardIndex === null) {
    flipFocused();
  } else {
    activateCard(state.drag.cardIndex);
  }
  state.drag.deltaX = 0;
  state.drag.cardIndex = null;
  layoutCards();
}

function onWheel(event) {
  if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 20) return;
  event.preventDefault();
  moveFocus(event.deltaX + event.deltaY > 0 ? 1 : -1);
}

function onKeyDown(event) {
  if (!['ArrowRight', 'ArrowLeft', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowRight') moveFocus(1);
  if (event.key === 'ArrowLeft') moveFocus(-1);
  if (event.key === 'Enter' || event.key === ' ') flipFocused();
}

els.buildButton.addEventListener('click', rebuild);
els.deckShell.addEventListener('pointerdown', onPointerDown);
els.deckShell.addEventListener('pointermove', onPointerMove);
els.deckShell.addEventListener('pointerup', onPointerUp);
els.deckShell.addEventListener('pointercancel', onPointerUp);
els.deckShell.addEventListener('wheel', onWheel, { passive: false });
els.deckShell.addEventListener('keydown', onKeyDown);
els.decisionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') rebuild();
});
window.addEventListener('resize', layoutCards);

renderLocalDeck();
