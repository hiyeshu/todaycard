# TodayCard - seeded decision cards
HTML + CSS + JavaScript

<directory>
./ - 极简单页决策卡原型，用户只输入一个决策题，系统自动生成可拖拽、可翻面的 TodayCard 牌堆
assets/ - 视觉资产语义层，保存 10x10 宫格图案预设和局部架构地图
</directory>

<config>
index.html - 唯一网页入口，声明极简品牌、中心牌堆、单句决策输入和折叠高级选项
styles.css - 视觉层，提供白底极简界面、圆角质感卡片 coverflow、10x10 网格和翻牌状态
app.js - 行为层，根据单句决策自动生成候选选项和带品牌、署名、月日的 seeded cards，按 assets/patterns.md 的预设生成宫格，驱动拖拽牌堆与原地翻牌
assets/CLAUDE.md - L2 资产地图，记录 assets 下每个文件的职责边界
assets/patterns.md - 10x10 图案预设源，用文本矩阵定义可进入卡片的图案
CLAUDE.md - L1 项目宪法，记录目录职责与文档同构边界
</config>

## 架构决策

TodayCard 继承 personality-receipt 的真相链思想：内容先成为稳定数据，再进入唯一网页。这里不引入构建链，不引入后端，不复制人格语义；`index.html` 只做极简入口，`styles.css` 保留白底 coverflow 语言并改成圆角实体卡，`assets/patterns.md` 定义 10x10 图案语义，`app.js` 管自动候选与 seeded renderer。

## 开发规范

- 选项图案必须由 `decision + option + index` 生成稳定 seed。
- 默认只要求用户输入一个决策题；自定义选项必须折叠为高级项。
- 颜色随机只从多样受控 palette 中选择，并按卡片序号错开，避免整组偏冷或撞色。
- 网格固定 10x10，图案预设写在 `assets/patterns.md`，app.js 中的 `GRID_PRESETS` 必须与它同构。
- 图案可以水平镜像增加变化，但不能纵向翻转；爱心、问号、箭头这类方向性图案不能被随机破坏语义。
- 卡面元信息属于 card 数据：左上品牌为 `Todaycard.app`，左下署名由 seed 选择，右下日期只显示 `06/22` 这种月日格式。
- 卡片背面默认朝上并展示 sealed stamp，答案只在点击后翻出的正面出现。
- 卡片边缘不使用齿孔小圆点，靠圆角、边框、阴影和轻纸面纹理建立质感。
- 鼠标点击或移动端点击卡片就是翻牌；桌面端 hover 轻微上浮作为点击反馈，点击牌堆空白处翻当前卡；不保留辅助翻牌按钮。
- 桌面端键盘只保留 ArrowLeft/ArrowRight 切牌、Enter/Space 翻当前卡，并阻止空格滚动页面。
- 翻牌不能重绘替换 DOM，必须给目标卡原地加 `.is-flipped` 播放旋转，且旋转主体是整张 `.card-inner`，不是只翻内容区。
- 拖动期间关闭卡片 transition，pointermove 只通过 requestAnimationFrame 刷新位置。
- 任何结构或职责变化，先更新对应文件头部，再检查本文件。

## 变更日志

- 2026-06-22: 创建单页 TodayCard 原型与 GEB L1 文档。
- 2026-06-22: 统一产品名大小写为 TodayCard，保持页面标题、品牌和卡面一致。
- 2026-06-22: 将卡面操作提示替换为 `Todaycard.app`、seeded 署名和当天日期。
- 2026-06-22: 新增 assets 图案源，宫格改为八个 10x10 预设并由 seed 选择；日期格式收敛为 `06/22`。
- 2026-06-22: 重画 heart 预设为更饱满的像素心，并移除纵向翻转。
- 2026-06-22: 将网页端点击收束到 pointer 流，卡片 hover 上浮，点击牌堆空白处翻当前卡，并修正键盘默认滚动。
- 2026-06-22: 交换牌背宫格与答案正面的语义，默认朝上的是牌背，翻开后才是答案正面。
- 2026-06-22: 拆分 HTML/CSS/JS，消除单文件超过 800 行的坏味道。
- 2026-06-22: 按 getstampstack demo 重做白底移动优先视觉，并将揭示改为正反面翻牌。
- 2026-06-22: 去掉边缘小圆点，改为圆角质感卡片。
- 2026-06-22: 扩展卡片 palette，加入暖色、亮色、深色，并按序号分散配色。
- 2026-06-22: 修正翻牌逻辑为原地旋转，不再通过重绘假装翻面。
- 2026-06-22: 点击任意卡片会先聚焦再翻牌，移动端 tap 同路径。
- 2026-06-22: 优化滑动路径，pointermove 改为 rAF 节流，拖动时禁用 transition。
- 2026-06-22: 将圆角、边框和阴影移入 `.card-inner`，实现整张卡片旋转翻页。
- 2026-06-22: 删除牌堆下方状态文案和辅助翻牌按钮，交互收敛为直接点击卡片。
- 2026-06-22: 按 dbs-good-question 收敛输入面，改为单句决策输入、自动生成候选选项和折叠高级项。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
