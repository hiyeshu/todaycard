/*
[INPUT]: 依赖 TodayCard 的青春可爱高饱和 candy palette、具象可爱 10x10 grid 契约和 app.js 的运行时消费
[OUTPUT]: 对外提供 window.TodayCardData，包含带 family 的 PALETTES、OPTION_LABELS、GRID_PRESETS 三个稳定数据源
[POS]: 项目数据层，只保存可扩展的静态 palette、选项编号和图案预设，不拥有 DOM、交互、音效或 Dify 行为
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
*/
(function () {
const PALETTES = [
  {
    name: 'soda-blue',
    family: 'blue',
    bg: '#ffffff',
    cell: '#f1f3ff',
    mark: '#606aff',
    text: '#5d6071',
    muted: '#a0a4b6',
    frame: '#606aff'
  },
  {
    name: 'sky-candy',
    family: 'sky',
    bg: '#ffffff',
    cell: '#eff7ff',
    mark: '#55a9ff',
    text: '#596470',
    muted: '#9ca8b4',
    frame: '#55a9ff'
  },
  {
    name: 'aqua-jelly',
    family: 'aqua',
    bg: '#ffffff',
    cell: '#eefbfc',
    mark: '#42edff',
    text: '#596769',
    muted: '#9ca9ad',
    frame: '#42edff'
  },
  {
    name: 'mint-cream',
    family: 'mint',
    bg: '#ffffff',
    cell: '#effaf5',
    mark: '#40fccf',
    text: '#596762',
    muted: '#9caaa5',
    frame: '#40fccf'
  },
  {
    name: 'melon-soda',
    family: 'green',
    bg: '#ffffff',
    cell: '#f1faed',
    mark: '#69fc41',
    text: '#5f6958',
    muted: '#a2ae9b',
    frame: '#69fc41'
  },
  {
    name: 'kiwi-milk',
    family: 'lime',
    bg: '#ffffff',
    cell: '#f5fbe9',
    mark: '#b9ff43',
    text: '#636b55',
    muted: '#a6af98',
    frame: '#b9ff43'
  },
  {
    name: 'lemon-cream',
    family: 'yellow',
    bg: '#ffffff',
    cell: '#fffade',
    mark: '#ffd946',
    text: '#6a644f',
    muted: '#aca58f',
    frame: '#ffd946'
  },
  {
    name: 'banana-milk',
    family: 'amber',
    bg: '#ffffff',
    cell: '#fff7df',
    mark: '#ffbd49',
    text: '#6a604f',
    muted: '#aca18f',
    frame: '#ffbd49'
  },
  {
    name: 'mango-milk',
    family: 'orange',
    bg: '#ffffff',
    cell: '#fff3e7',
    mark: '#ff8f52',
    text: '#6a5e56',
    muted: '#ad9f98',
    frame: '#ff8f52'
  },
  {
    name: 'peach-soda',
    family: 'peach',
    bg: '#ffffff',
    cell: '#fff1eb',
    mark: '#ff735f',
    text: '#6a5c58',
    muted: '#ad9e9a',
    frame: '#ff735f'
  },
  {
    name: 'coral-jelly',
    family: 'coral',
    bg: '#ffffff',
    cell: '#fff0ef',
    mark: '#ff665d',
    text: '#6a5b59',
    muted: '#ad9d9b',
    frame: '#ff665d'
  },
  {
    name: 'strawberry-milk',
    family: 'strawberry',
    bg: '#ffffff',
    cell: '#fff0f3',
    mark: '#ff5a76',
    text: '#6a5a5d',
    muted: '#ad9da1',
    frame: '#ff5a76'
  },
  {
    name: 'rose-milk',
    family: 'rose',
    bg: '#ffffff',
    cell: '#fff0f7',
    mark: '#ff55a1',
    text: '#6a5a62',
    muted: '#ad9da5',
    frame: '#ff55a1'
  },
  {
    name: 'bubblegum-milk',
    family: 'pink',
    bg: '#ffffff',
    cell: '#fff2fb',
    mark: '#ff5ecb',
    text: '#6a5b66',
    muted: '#ad9fa9',
    frame: '#ff5ecb'
  },
  {
    name: 'lavender-soda',
    family: 'purple',
    bg: '#ffffff',
    cell: '#f4f1ff',
    mark: '#8d70ff',
    text: '#605d72',
    muted: '#a29eb8',
    frame: '#8d70ff'
  },
  {
    name: 'lilac-sugar',
    family: 'purple',
    bg: '#ffffff',
    cell: '#f8f0ff',
    mark: '#b669ff',
    text: '#655a72',
    muted: '#a69bb8',
    frame: '#b669ff'
  },
  {
    name: 'grape-cream',
    family: 'purple',
    bg: '#ffffff',
    cell: '#f4f1ff',
    mark: '#9570ff',
    text: '#615d72',
    muted: '#a39fb8',
    frame: '#9570ff'
  },
  {
    name: 'blueberry-milk',
    family: 'indigo',
    bg: '#ffffff',
    cell: '#f0f3ff',
    mark: '#7083ff',
    text: '#5d6072',
    muted: '#a0a3b8',
    frame: '#7083ff'
  },
  {
    name: 'apricot-sugar',
    family: 'apricot',
    bg: '#ffffff',
    cell: '#fff4eb',
    mark: '#ff9a5c',
    text: '#6a6058',
    muted: '#ada19a',
    frame: '#ff9a5c'
  },
  {
    name: 'cherry-cream',
    family: 'cherry',
    bg: '#ffffff',
    cell: '#fff0f2',
    mark: '#ff657a',
    text: '#6a5b5e',
    muted: '#ad9da1',
    frame: '#ff657a'
  }
];

const OPTION_LABELS = [
  'Choice A',
  'Choice B',
  'Choice C',
  'Choice D'
];

const GRID_PRESETS = [
  {
    name: 'heart',
    rows: [
      '..##..##..',
      '.########.',
      '##########',
      '##########',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
      '....##....',
      '..........'
    ]
  },
  {
    name: 'smile',
    rows: [
      '..######..',
      '.########.',
      '##......##',
      '#.##..##.#',
      '#........#',
      '#........#',
      '#..####..#',
      '##......##',
      '.########.',
      '..######..'
    ]
  },
  {
    name: 'star',
    rows: [
      '....##....',
      '....##....',
      '..######..',
      '##########',
      '..######..',
      '...####...',
      '..######..',
      '.###..###.',
      '.##....##.',
      '..........'
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
      '.....##...',
      '.....###..',
      '#########.',
      '##########',
      '#########.',
      '.....###..',
      '.....##...',
      '.....#....',
      '..........'
    ]
  },
  {
    name: 'flower',
    rows: [
      '...####...',
      '..######..',
      '.##.##.##.',
      '##########',
      '..######..',
      '...####...',
      '....##....',
      '....##....',
      '..######..',
      '.##..##...'
    ]
  },
  {
    name: 'moon',
    rows: [
      '...####...',
      '..######..',
      '.######...',
      '.#####....',
      '######....',
      '######....',
      '.#####....',
      '.######...',
      '..######..',
      '...####...'
    ]
  },
  {
    name: 'clover',
    rows: [
      '..##..##..',
      '.####.###.',
      '.########.',
      '..######..',
      '...####...',
      '##########',
      '...####...',
      '..######..',
      '.###.####.',
      '..##..##..'
    ]
  },
  {
    name: 'ribbon',
    rows: [
      '##......##',
      '###....###',
      '####..####',
      '.########.',
      '..######..',
      '..######..',
      '.########.',
      '####..####',
      '###....###',
      '##......##'
    ]
  },
  {
    name: 'crown',
    rows: [
      '##..##..##',
      '##..##..##',
      '###.##.###',
      '##########',
      '.########.',
      '.########.',
      '.########.',
      '##########',
      '..........',
      '..........'
    ]
  },
  {
    name: 'gift',
    rows: [
      '##########',
      '..##..##..',
      '##########',
      '##########',
      '##..##..##',
      '##..##..##',
      '##########',
      '##..##..##',
      '##..##..##',
      '##########'
    ]
  },
  {
    name: 'music',
    rows: [
      '.....####.',
      '.....####.',
      '.....##...',
      '.....##...',
      '.....##...',
      '.....##...',
      '..####....',
      '.######...',
      '.######...',
      '..####....'
    ]
  },
  {
    name: 'sun',
    rows: [
      '#...##...#',
      '.#.####.#.',
      '..######..',
      '##########',
      '##########',
      '..######..',
      '.#.####.#.',
      '#...##...#',
      '....##....',
      '..........'
    ]
  },
  {
    name: 'lollipop',
    rows: [
      '..####....',
      '.######...',
      '.######...',
      '..####....',
      '...##.....',
      '...##.....',
      '...##.....',
      '...##.....',
      '..####....',
      '.##..##...'
    ]
  },
  {
    name: 'balloon',
    rows: [
      '...####...',
      '..######..',
      '.########.',
      '.########.',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
      '...##.....',
      '..##......'
    ]
  },
  {
    name: 'check',
    rows: [
      '........##',
      '.......###',
      '......###.',
      '##...###..',
      '###.###...',
      '.#####....',
      '..###.....',
      '...#......',
      '..........',
      '..........'
    ]
  }
];

  window.TodayCardData = {
    PALETTES,
    OPTION_LABELS,
    GRID_PRESETS
  };
}());
