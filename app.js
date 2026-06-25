/*
[INPUT]: 依赖 index.html 的控件节点、styles.css 的状态类、data.js 的 seeded palette、选项编号与图案数据、audio.js 的抽卡/发牌/滑卡/翻牌音效、functions/api/cards.js 的 Dify 代理、浏览器语言、用户输入 decision 和当前日期
[OUTPUT]: 对外提供 i18n 文案绑定、单句决策输入、Dify/本地候选选项、带品牌/选项编号/月日元信息的 TodayCard 数据、默认正面 10x10 网格、答案页同源实色符号、一屏锁定循环移动牌堆、逐张发牌动效、点击当前卡翻牌、点击非当前区域选卡、切牌音效和轻震反馈事件
[POS]: 项目行为层，承接 TodayCard.app.v1 的最小数据真相源，驱动唯一网页但不持有视觉细节
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
*/
/* ------------------------------
   数据层: 稳定 seed, 不信裸随机
------------------------------ */
const { PALETTES, OPTION_LABELS, GRID_PRESETS } = window.TodayCardData;
const AUTO_OPTION_COUNT = 4;
const CARD_BRAND = 'Todaycard.app';
const DEAL_STAGGER_MS = 110;
const DEAL_SETTLE_MS = 620;
const TAP_MOVE_TOLERANCE_PX = 10;
const SWIPE_THRESHOLD_PX = 44;
const HAPTICS = {
  select: 8,
  swipe: 12,
  flip: [10, 28, 12]
};
const MESSAGES = {
  zh: {
    lang: 'zh-CN',
    decisionPlaceholder: '今天想决定什么？',
    decisionAria: '今天想决定什么？',
    fallbackDecision: '今天的决定',
    drawButton: '抽卡',
    buildingButton: '发牌中',
    emptyState: '暂无卡片',
    answerLabel: '答案',
    defaultOptions: [
      '现在做一个最小版本',
      '先不做，保留精力',
      '问一个可信的人',
      '只投入 30 分钟试验'
    ]
  },
  en: {
    lang: 'en',
    decisionPlaceholder: 'What do you want to decide today?',
    decisionAria: 'What do you want to decide today?',
    fallbackDecision: "today's decision",
    drawButton: 'Draw',
    buildingButton: 'Dealing',
    emptyState: 'No cards',
    answerLabel: 'Answer',
    defaultOptions: [
      'Make the smallest version now',
      'Pause and save your energy',
      'Ask one trusted person',
      'Try it for 30 minutes'
    ]
  }
};

const state = {
  decision: '',
  cards: [],
  focus: 0,
  revealed: new Set(),
  paletteShift: 0,
  requestId: 0,
  isDealing: false,
  dealTimers: [],
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
  buildButton: document.getElementById('buildButton'),
  buildText: document.querySelector('#buildButton .button-text'),
  deckShell: document.getElementById('deckShell'),
  deck: document.getElementById('deck'),
  emptyState: document.getElementById('emptyState')
};

const localeKey = resolveLocale();
const copy = MESSAGES[localeKey];

function resolveLocale() {
  const language = `${(navigator.languages && navigator.languages[0]) || navigator.language || ''}`.toLowerCase();
  if (!language) return 'zh';
  return language.startsWith('zh') ? 'zh' : 'en';
}

function t(key) {
  return copy[key] || MESSAGES.en[key] || key;
}

function currentDecision() {
  return els.decisionInput.value.trim() || t('fallbackDecision');
}

function applyI18n() {
  document.documentElement.lang = t('lang');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  });
  els.decisionInput.placeholder = t('decisionPlaceholder');
  els.decisionInput.setAttribute('aria-label', t('decisionAria'));
  if (els.buildText) els.buildText.textContent = t('drawButton');
}

function playSound(name, detail) {
  const audio = window.TodayCardAudio;
  if (!audio || typeof audio[name] !== 'function') return;
  audio[name](detail);
}

function haptic(kind) {
  if (!navigator.vibrate) return;
  navigator.vibrate(HAPTICS[kind] || HAPTICS.select);
}

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

function wrapIndex(index, count) {
  if (!count) return 0;
  return ((index % count) + count) % count;
}

function relativeCardOffset(index, focus, count) {
  let offset = index - focus;
  if (count < 3) return offset;
  const half = count / 2;
  if (offset > half) offset -= count;
  if (offset < -half) offset += count;
  return offset;
}

function normalizeAnswerList(values) {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, AUTO_OPTION_COUNT);
}

function decisionObject(decision) {
  return decision
    .replace(/[?？。！!]/g, '')
    .replace(/^今天(要不要|想不想|想)?/, '')
    .replace(/^(推进|推动|做|开始|去|试试)/, '')
    .trim();
}

function optionSuggestions(decision) {
  const clean = decision.trim() || '这件事';
  if (clean === t('fallbackDecision')) return t('defaultOptions').slice(0, AUTO_OPTION_COUNT);
  if (localeKey === 'en') {
    const object = clean.replace(/[?？。！!]/g, '').slice(0, 28) || t('fallbackDecision');
    return [
      `Move ${object} forward now`,
      'Pause for now',
      'Ask one person first',
      'Try it for 30 minutes'
    ].slice(0, AUTO_OPTION_COUNT);
  }
  const object = decisionObject(clean).slice(0, 18) || '这件事';
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

async function optionsFor(decision) {
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

function shuffledIndexes(count, rng) {
  const indexes = Array.from({ length: count }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

function uniquePaletteIndexes(decision, count) {
  const rng = createRng(hashString(`${decision}\npalette-deck`));
  const groups = new Map();
  PALETTES.forEach((palette, index) => {
    const family = palette.family || palette.name;
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(index);
  });
  const families = [...groups.keys()];
  const familyOrder = shuffledIndexes(families.length, rng);
  return Array.from({ length: count }, (_, index) => {
    const family = families[familyOrder[index % familyOrder.length]];
    const members = groups.get(family);
    return members[Math.floor(rng() * members.length)];
  });
}

function currentDateStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function createCards(decision, options) {
  const date = currentDateStamp();
  const paletteIndexes = uniquePaletteIndexes(decision, options.length);
  return options.map((option, index) => {
    const seed = cardSeed(decision, option, index);
    return {
      id: `TC.${String((seed % 100000)).padStart(5, '0')}`,
      index,
      option,
      choiceLabel: OPTION_LABELS[index] || `Choice ${index + 1}`,
      date,
      seed,
      paletteIndex: paletteIndexes[index],
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

function solidSymbolHtml(grid) {
  return grid
    .map((row, rowIndex) => row
      .map((on, columnIndex) => {
        if (!on) return '';
        return `<span class="symbol-cell" style="--row:${rowIndex + 1};--column:${columnIndex + 1};"></span>`;
      })
      .join(''))
    .join('');
}

function cardHtml(card) {
  const flipped = state.revealed.has(card.index);
  const answerSymbol = solidSymbolHtml(card.grid);
  return `
    <article class="card${flipped ? ' is-flipped' : ''}" data-index="${card.index}" aria-label="TodayCard ${card.index + 1}">
      <div class="deal-motion">
        <div class="card-inner">
          <div class="stamp-face card-back">
            <div class="card-top">
              <span class="card-title">${CARD_BRAND}</span>
              <span class="card-id">${card.id}</span>
            </div>
            <div class="grid" aria-hidden="true">${gridHtml(card.grid)}</div>
            <div class="card-bottom">
              <span class="card-choice-label">${escapeHtml(card.choiceLabel)}</span>
              <span class="card-date">${card.date}</span>
            </div>
          </div>
          <div class="stamp-face card-front">
            <div class="card-top">
              <span class="card-title">${CARD_BRAND}</span>
              <span class="card-id">${card.id}</span>
            </div>
            <div class="symbol-grid" aria-hidden="true">${answerSymbol}</div>
            <div class="answer-copy">
              <span class="option-label">${escapeHtml(t('answerLabel'))}</span>
              <p class="answer-text">${escapeHtml(card.option)}</p>
            </div>
            <div class="card-bottom">
              <span class="card-choice-label">${escapeHtml(card.choiceLabel)}</span>
              <span class="card-date">${card.date}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function clearDealTimers() {
  state.dealTimers.forEach((timer) => window.clearTimeout(timer));
  state.dealTimers = [];
  state.isDealing = false;
  els.deckShell.classList.remove('is-dealing');
}

function markDealingCard(node) {
  const index = Number(node.dataset.index);
  node.classList.add('is-dealing');
  node.style.setProperty('--deal-delay', `${index * DEAL_STAGGER_MS}ms`);
  node.addEventListener('animationend', () => {
    node.classList.remove('is-dealing');
  }, { once: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderCards(options = {}) {
  els.deck.innerHTML = state.cards.map(cardHtml).join('');
  els.emptyState.hidden = state.cards.length > 0;
  const cardNodes = [...els.deck.querySelectorAll('.card')];
  cardNodes.forEach((node) => {
    const card = state.cards[Number(node.dataset.index)];
    setCardPalette(node, paletteFor(card));
  });
  layoutCards();
  if (options.deal) cardNodes.forEach(markDealingCard);
}

function layoutCards() {
  const shellWidth = els.deckShell.clientWidth || window.innerWidth;
  const dragOffset = state.drag.active ? state.drag.deltaX / 118 : 0;
  const compactSpread = clamp(shellWidth * 0.34, 112, 150);
  const spread = shellWidth < 520 ? compactSpread : 250;
  const yaw = shellWidth < 520 ? -24 : -30;
  const count = state.cards.length;
  els.deck.querySelectorAll('.card').forEach((node) => {
    const index = Number(node.dataset.index);
    const offset = relativeCardOffset(index, state.focus, count) + dragOffset;
    const distance = Math.abs(offset);
    node.classList.toggle('is-focused', distance < 0.5);
    node.style.setProperty('--x', `${offset * spread}px`);
    node.style.setProperty('--z', `${distance === 0 ? 60 : -distance * 48}px`);
    node.style.setProperty('--ry', `${offset * yaw}deg`);
    node.style.setProperty('--rz', `${offset * 1.4}deg`);
    node.style.setProperty('--scale', `${Math.max(0.68, 1 - distance * 0.1)}`);
    node.style.setProperty('--opacity', `${distance > 3 ? 0.18 : Math.max(0.32, 1 - distance * 0.15)}`);
    node.style.setProperty('--sat', `${distance < 0.5 ? 1 : 0.68}`);
    node.style.zIndex = String(100 - Math.round(distance * 10));
  });
}

function setBuilding(isBuilding) {
  els.buildButton.disabled = isBuilding;
  els.buildButton.classList.toggle('is-building', isBuilding);
  els.buildButton.setAttribute('aria-busy', String(isBuilding));
  els.buildButton.setAttribute('aria-label', isBuilding ? t('buildingButton') : t('drawButton'));
  if (els.buildText) els.buildText.textContent = isBuilding ? t('buildingButton') : t('drawButton');
}

function finishDeal(requestId) {
  if (requestId !== state.requestId) return;
  state.dealTimers = [];
  state.isDealing = false;
  els.deckShell.classList.remove('is-dealing');
  setBuilding(false);
}

function startDealSequence(requestId) {
  clearDealTimers();
  state.isDealing = true;
  els.deckShell.classList.add('is-dealing');
  renderCards({ deal: true });

  state.cards.forEach((card) => {
    const timer = window.setTimeout(() => {
      if (requestId === state.requestId) playSound('playDealCard', { index: card.index });
    }, card.index * DEAL_STAGGER_MS);
    state.dealTimers.push(timer);
  });

  const total = Math.max(0, state.cards.length - 1) * DEAL_STAGGER_MS + DEAL_SETTLE_MS;
  state.dealTimers.push(window.setTimeout(() => finishDeal(requestId), total));
}

async function rebuild() {
  if (els.buildButton.disabled) return;
  const decision = currentDecision();
  const requestId = state.requestId + 1;
  state.requestId = requestId;
  clearDealTimers();
  setBuilding(true);
  playSound('playDrawStart');
  let didStartDeal = false;
  try {
    const options = await optionsFor(decision);
    if (requestId !== state.requestId) return;
    state.decision = decision;
    state.cards = createCards(decision, options);
    state.focus = 0;
    state.revealed = new Set();
    startDealSequence(requestId);
    didStartDeal = true;
  } finally {
    if (requestId === state.requestId && !didStartDeal) setBuilding(false);
  }
}

function renderLocalDeck() {
  const decision = currentDecision();
  const options = optionSuggestions(decision);
  state.decision = decision;
  state.cards = createCards(decision, options);
  state.focus = 0;
  state.revealed = new Set();
  renderCards();
}

function focusCard(index, feedback = 'select') {
  if (!state.cards.length || state.isDealing) return;
  const next = wrapIndex(index, state.cards.length);
  if (next === state.focus) return;
  const direction = relativeCardOffset(next, state.focus, state.cards.length);
  state.focus = next;
  layoutCards();
  haptic(feedback);
  playSound('playDeckShift', { direction, feedback, index: next });
}

function moveFocus(delta, feedback = 'select') {
  focusCard(state.focus + delta, feedback);
}

function flipFocused() {
  if (state.isDealing) return;
  const current = state.cards[state.focus];
  if (!current) return;
  flipCard(current.index);
}

function activateCard(index) {
  if (state.isDealing) return;
  if (index !== state.focus) {
    focusCard(index, 'select');
    return;
  }
  flipCard(index);
}

function activateByPosition(clientX) {
  const current = els.deck.querySelector(`.card[data-index="${state.focus}"]`);
  if (!current) return;
  const rect = current.getBoundingClientRect();
  if (clientX < rect.left) {
    moveFocus(-1, 'select');
    return;
  }
  if (clientX > rect.right) {
    moveFocus(1, 'select');
    return;
  }
  flipFocused();
}

function flipCard(index) {
  const card = state.cards[index];
  if (!card || state.isDealing || state.revealed.has(index)) return;
  state.revealed.add(index);
  haptic('flip');
  playSound('playFlipReveal');
  const node = els.deck.querySelector(`.card[data-index="${index}"]`);
  if (node) {
    node.classList.add('is-flipped');
  }
}

function onPointerDown(event) {
  if (state.isDealing) return;
  if (event.cancelable) event.preventDefault();
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
  if (event.cancelable) event.preventDefault();
  state.drag.deltaX = event.clientX - state.drag.startX;
  state.drag.moved = Math.abs(state.drag.deltaX) > TAP_MOVE_TOLERANCE_PX;
  if (!state.drag.frame) {
    state.drag.frame = requestAnimationFrame(() => {
      state.drag.frame = 0;
      layoutCards();
    });
  }
}

function onPointerUp(event) {
  if (!state.drag.active) return;
  const deltaX = state.drag.deltaX;
  const isSwipe = Math.abs(deltaX) >= SWIPE_THRESHOLD_PX;
  const steps = Math.sign(-deltaX) * Math.max(1, Math.round(Math.abs(deltaX) / 118));
  const wasCancelled = event.type === 'pointercancel';
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
  if (!wasCancelled) {
    if (isSwipe) {
      moveFocus(steps, 'swipe');
    } else if (state.drag.cardIndex === null) {
      activateByPosition(event.clientX);
    } else {
      activateCard(state.drag.cardIndex);
    }
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

applyI18n();
renderLocalDeck();
