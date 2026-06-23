# TodayCard - seeded decision cards
HTML + CSS + JavaScript

<directory>
./ - 极简单页决策卡原型，用户只输入一个决策题，系统自动生成可拖拽、可翻面的 TodayCard 牌堆
assets/ - 视觉资产语义层，保存 10x10 宫格图案预设和局部架构地图
functions/ - Cloudflare Pages Function 层，保存 Dify 代理 API，隔离浏览器与服务端密钥
skills/ - Agent skill 标准目录，保存可被 `npx skills` 发现和安装的 TodayCard 能力包
</directory>

<config>
index.html - 唯一网页入口，声明极简品牌、中心牌堆、单句决策输入和折叠高级选项
styles.css - 视觉层，提供白底极简界面、圆角质感卡片 coverflow、10x10 网格和翻牌状态
app.js - 行为层，根据单句决策自动生成候选选项和带品牌、署名、月日的 seeded cards，按 assets/patterns.md 的预设生成宫格，驱动拖拽牌堆与原地翻牌
package.json - 构建边界，`npm run build` 只复制公开站点文件到 dist，避免 skill 和架构文档被 Pages 发布
.gitignore - 版本控制边界，忽略 dist 构建产物和 Wrangler 本地缓存，保持源码仓库干净
assets/CLAUDE.md - L2 资产地图，记录 assets 下每个文件的职责边界
assets/patterns.md - 10x10 图案预设源，用文本矩阵定义可进入卡片的图案
functions/CLAUDE.md - L2 Function 地图，记录服务端 API 边界
functions/api/CLAUDE.md - L2 API 地图，记录 Cloudflare Pages Function 文件职责
functions/api/cards.js - Dify 代理接口，读取 Cloudflare 环境变量并返回 4 条 answers
skills/CLAUDE.md - L2 skill 容器地图，记录可安装 skill 的发现边界
skills/todaycard/CLAUDE.md - L2 TodayCard skill 地图，记录 skill 包内文件职责
skills/todaycard/SKILL.md - Agent skill 入口，定义 TodayCard 类任务的触发条件、单文件打包和工作流
skills/todaycard/agents/openai.yaml - skill UI 元数据，定义展示名、短描述和默认提示
skills/todaycard/assets/CLAUDE.md - L2 skill 资产地图，记录可复制资源职责
skills/todaycard/assets/patterns.md - 10x10 图案预设资产，供 skill 使用者复制进页面实现
skills/todaycard/assets/todaycard-single.html - 单 HTML 模板资产，内联 TodayCard 结构、样式和行为
skills/todaycard/references/todaycard-contract.md - TodayCard 细节契约，记录数据、视觉、交互、单 HTML 和部署边界
CLAUDE.md - L1 项目宪法，记录目录职责与文档同构边界
AGENTS.md - Agent 入口说明，镜像 L1 地图并服务 Codex 加载
</config>

## 架构决策

TodayCard 继承 personality-receipt 的真相链思想：内容先成为稳定数据，再进入唯一网页。这里不复制人格语义；`index.html` 只做极简入口，`styles.css` 保留白底 coverflow 语言并改成圆角实体卡，`assets/patterns.md` 定义 10x10 图案语义，`app.js` 管 Dify/本地候选与 seeded renderer，`functions/api/cards.js` 只做 Dify 密钥代理，`skills/todaycard/` 把这套产品契约包装成可被 `npx skills` 发现的标准能力包，并用 `skills/todaycard/assets/todaycard-single.html` 提供可复制的单文件交付资产。

## 开发规范

- 选项图案必须由 `decision + option + index` 生成稳定 seed。
- 默认只要求用户输入一个决策题；自定义选项必须折叠为高级项。
- 首次打开页面只渲染本地默认卡；只有用户点击“抽一组卡”或按 Enter 才允许请求 Dify。
- 颜色随机只从多样受控 palette 中选择，并按卡片序号错开，避免整组偏冷或撞色。
- 网格固定 10x10，图案预设写在 `assets/patterns.md`，app.js 中的 `GRID_PRESETS` 必须与它同构。
- Dify 只负责生成 `answers`；卡片 seed、颜色、署名、日期和翻牌仍由 app.js 控制。
- Dify API Key 只允许存在 Cloudflare 环境变量 `DIFY_API_KEY`，前端不得保存或拼接密钥。
- Cloudflare 环境变量推荐：`DIFY_API_KEY`、`DIFY_API_BASE_URL=https://api.dify.ai/v1`、`DIFY_INPUT_NAME=query`、`DIFY_OUTPUT_NAME=answers`；只有使用 `/workflows/{id}/run` 时才设置 `DIFY_WORKFLOW_ID`。
- 图案可以水平镜像增加变化，但不能纵向翻转；爱心、问号、箭头这类方向性图案不能被随机破坏语义。
- 卡面元信息属于 card 数据：左上品牌为 `Todaycard.app`，左下署名由 seed 选择，右下日期只显示 `06/22` 这种月日格式。
- 卡片背面默认朝上并展示 sealed stamp，答案只在点击后翻出的正面出现。
- 卡片边缘不使用齿孔小圆点，靠圆角、边框、阴影和轻纸面纹理建立质感。
- 鼠标点击或移动端点击卡片就是翻牌；桌面端 hover 轻微上浮作为点击反馈，点击牌堆空白处翻当前卡；不保留辅助翻牌按钮。
- 桌面端键盘只保留 ArrowLeft/ArrowRight 切牌、Enter/Space 翻当前卡，并阻止空格滚动页面。
- 翻牌不能重绘替换 DOM，必须给目标卡原地加 `.is-flipped` 播放旋转，且旋转主体是整张 `.card-inner`，不是只翻内容区。
- 移动端翻牌必须显式使用 `-webkit-perspective`、`-webkit-transform-style`、`-webkit-backface-visibility` 和轻微 `translateZ` 分层，防止正反面重影或镜像字泄露。
- 拖动期间关闭卡片 transition，pointermove 只通过 requestAnimationFrame 刷新位置。
- Cloudflare Pages 公开输出必须来自 `dist/`；`skills/`、`CLAUDE.md`、`AGENTS.md` 和 references 只进仓库，不进站点。
- Cloudflare Pages Functions 来自 `functions/`，不进入 `dist/`，但随仓库部署为同源 `/api/*`。
- 单 HTML 交付从 `skills/todaycard/assets/todaycard-single.html` 复制，不反向替代 `index.html`、`styles.css`、`app.js` 三文件源码真相。
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
- 2026-06-23: 新增 TodayCard Agent skill 包，并加入 dist 构建边界，防止 skill 文件被 Pages 公开发布。
- 2026-06-23: 新增 .gitignore 忽略 dist，保持构建产物只属于 Pages 输出层。
- 2026-06-23: 将 skill 包迁移到 `skills/todaycard/`，让仓库根保持 App，skill 作为标准叶子单元被 `npx skills` 安装。
- 2026-06-23: 补全 `skills/todaycard/assets/todaycard-single.html` 单 HTML 模板资产，并为 skill assets 创建 L2 地图。
- 2026-06-23: 新增 `/api/cards` Dify 代理，用户主动抽卡时优先使用 Dify answers，失败降级本地候选。
- 2026-06-23: 首屏改为本地默认卡，避免打开页面就消耗 Dify 调用。
- 2026-06-23: 修复移动端 WebKit 翻牌背面泄露，给 3D 卡面补齐 backface 和层级隔离。
- 2026-06-23: 忽略 `.wrangler/` 本地缓存，防止账号状态进入仓库。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
