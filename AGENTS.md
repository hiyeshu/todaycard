# TodayCard - seeded decision cards
HTML + CSS + JavaScript

<directory>
./ - 极简单页决策卡原型，用户只输入一个决策题，系统自动生成可拖拽、可翻面的 TodayCard 牌堆
assets/ - 视觉资产语义层，保存 10x10 宫格图案预设、SVG favicon、OG 封面和局部架构地图
functions/ - Cloudflare Pages Function 层，保存 Dify 代理 API，隔离浏览器与服务端密钥
skills/ - Agent skill 标准目录，保存可被 `npx skills` 发现和安装的 TodayCard 能力包
</directory>

<config>
index.html - 唯一网页入口，声明极简品牌、SEO/OG/JSON-LD 元信息、SVG favicon、中心牌堆、圆框单句决策输入、右侧状态文字游戏抽卡按钮和低对比 GitHub 源仓库链接
styles.css - 视觉层，提供淡彩灰格移动界面、移动端一屏锁定且与输入同轴的 full-bleed 圆角质感卡片 coverflow、默认正面 10x10 网格、答案页同源实色符号、两行答案位、大圆框输入、右侧状态文字游戏抽卡按钮、灰色源仓库链接、隔离层逐张发牌动效和翻牌状态
data.js - 数据层，提供青春可爱高饱和 candy palette、palette family、Choice A-D 选项编号和 16 个具象可爱 10x10 图案预设，保证同组卡片可分配不重复色相家族
audio.js - 声音层，使用 Web Audio 合成抽卡启动、逐张发牌、滑卡切牌和翻牌 Hero Moment 四段 8-bit 音效
app.js - 行为层，根据单句决策自动生成候选选项和带品牌、选项编号、月日的 seeded cards，消费 data.js 的 palette、选项编号与图案，生成默认正面网格和答案页同源实色符号，驱动循环拖拽牌堆、逐张发牌、当前卡原地翻牌、非当前区域选卡、轻震反馈和音效事件
package.json - 构建边界，`npm run build` 只复制公开站点文件、data.js、audio.js、favicon、OG 图、robots、sitemap 和 manifest 到 dist，避免 skill 和架构文档被 Pages 发布
.gitignore - 版本控制边界，忽略 dist 构建产物和 Wrangler 本地缓存，保持源码仓库干净
README.md - 仓库入口文档，用 shieldcn badge/header 展示项目状态，并说明运行、Dify、部署和 skill 边界
assets/CLAUDE.md - L2 资产地图，记录 assets 下每个文件的职责边界
assets/patterns.md - 10x10 图案预设源，用文本矩阵定义可进入卡片的图案
assets/todaycard.svg - SVG favicon 品牌资产，用蓝白宫格标识 TodayCard
assets/og.svg - 1200x630 社交预览图，供 Open Graph 和 Twitter Card 引用
robots.txt - 搜索引擎抓取入口，允许全站抓取并声明 sitemap 地址
sitemap.xml - 搜索引擎站点地图，只声明 todaycard.app 首页 canonical URL
site.webmanifest - Web App 安装元信息，声明 TodayCard 名称、主题色和 SVG icon
README.md - 仓库对外说明，概述 TodayCard 产品、运行方式、Dify 接入、部署边界、skill 包和开发铁律
functions/CLAUDE.md - L2 Function 地图，记录服务端 API 边界
functions/api/CLAUDE.md - L2 API 地图，记录 Cloudflare Pages Function 文件职责
functions/api/cards.js - Dify 代理接口，读取 Cloudflare 环境变量并返回 4 条 answers
skills/CLAUDE.md - L2 skill 容器地图，记录可安装 skill 的发现边界
skills/todaycard/CLAUDE.md - L2 TodayCard skill 地图，记录 skill 包内文件职责
skills/todaycard/SKILL.md - Agent skill 入口，定义 TodayCard 类任务的触发条件、单文件打包和工作流
skills/todaycard/agents/openai.yaml - skill UI 元数据，定义展示名、短描述和默认提示
skills/todaycard/assets/CLAUDE.md - L2 skill 资产地图，记录可复制资源职责
skills/todaycard/assets/patterns.md - 10x10 图案预设资产，供 skill 使用者复制进页面实现
skills/todaycard/assets/todaycard-single.html - 单 HTML 模板资产，内联 TodayCard favicon、结构、移动端一屏锁定且与输入同轴的循环 full-bleed coverflow、默认正面 10x10 网格、答案页同源实色符号、选卡/翻牌行为、游戏化抽卡按钮、发牌动效和 Web Audio 仪式音效
skills/todaycard/references/todaycard-contract.md - TodayCard 细节契约，记录数据、视觉、交互、单 HTML 和部署边界
CLAUDE.md - L1 项目宪法，记录目录职责与文档同构边界
AGENTS.md - Agent 入口说明，镜像 L1 地图并服务 Codex 加载
</config>

## 架构决策

TodayCard 继承 personality-receipt 的真相链思想：内容先成为稳定数据，再进入唯一网页。这里不复制人格语义；`index.html` 只做极简入口，`styles.css` 保留白底 coverflow 语言并改成圆角实体卡，`assets/patterns.md` 定义 10x10 图案语义，`data.js` 管 palette、选项编号和图案数据，`app.js` 管 Dify/本地候选、seeded renderer 和发牌状态，`audio.js` 管抽卡、发牌、滑卡和翻牌反馈音效，`functions/api/cards.js` 只做 Dify 密钥代理，`skills/todaycard/` 把这套产品契约包装成可被 `npx skills` 发现的标准能力包，并用 `skills/todaycard/assets/todaycard-single.html` 提供可复制的单文件交付资产。

## 开发规范

- 选项图案必须由 `decision + option + index` 生成稳定 seed。
- 默认只要求用户输入一个决策题；不暴露自定义选项输入，候选项由 Dify 或本地逻辑生成。
- SEO 真相源在 `index.html` 的 head、`robots.txt`、`sitemap.xml`、`site.webmanifest` 和 `assets/og.svg`；canonical 必须指向 `https://todaycard.app/`。
- 首次打开页面只渲染本地默认卡；只有用户点击“抽卡”或按 Enter 才允许请求 Dify。
- 决策输入默认空值，只显示 placeholder `今天想决定什么？`；输入组件只保留大圆框，不预填具体问题。
- 抽卡控制必须保持游戏化但轻量：按钮呈现为输入框右侧的紧凑文字按钮，不能使用装饰横线或无语义图标，也不能回退成全宽表单 CTA。
- GitHub 源仓库链接只能作为低对比页脚元信息存在，默认灰色、细字重、与输入区保持明显垂直留白，不得抢过输入和牌堆的视觉权重。
- 抽卡后必须进入逐张发牌状态，4 张卡按固定 stagger 落入 coverflow；发牌期间禁止拖动和翻牌，避免状态互踩。
- 发牌动效只能作用在 `.deal-motion` 隔离层，不能直接动画 `.card` 的 coverflow transform，避免 3D 插值重影。
- 抽卡、发牌、滑卡、翻牌音效使用 Sensory UI `arcade` / `hero.milestone` 思路的 8-bit Web Audio 分层合成，由 audio.js 负责声音，app.js 只发事件，不让声音进入 card 数据、seed 或 Dify payload。
- 颜色随机只从 data.js 的青春可爱高饱和 candy palette 中选择；同一组卡必须先洗 palette family 再取色，不能出现重复色相家族；低明度、脏色和泥色不得进入 palette。
- 网格固定 10x10，图案预设写在 `assets/patterns.md`，data.js 中的 `GRID_PRESETS` 必须与它同构。
- 默认正面必须保留原 10x10 网格：`#` 为实色块，`.` 为浅底格。
- 答案页必须复用同一个 `card.grid`，但只画 `#` 对应的实色块，`.` 只作为布局空位。
- 答案页必须保留两行答案文字高度，避免短答案和长答案让卡面跳动。
- 图案必须是爱心、笑脸、星星、问号、箭头、花、月亮、幸运草、蝴蝶结、皇冠、礼物、音符、太阳、棒棒糖、气球、对勾这类具象可爱符号；抽象几何不能进入 preset。
- Dify 只负责生成 `answers`；卡片 seed、颜色、选项编号、日期和翻牌仍由 app.js 控制。
- Dify API Key 只允许存在 Cloudflare 环境变量 `DIFY_API_KEY`，前端不得保存或拼接密钥。
- Cloudflare 环境变量推荐：`DIFY_API_KEY`、`DIFY_API_BASE_URL=https://api.dify.ai/v1`、`DIFY_INPUT_NAME=query`、`DIFY_OUTPUT_NAME=answers`；只有使用 `/workflows/{id}/run` 时才设置 `DIFY_WORKFLOW_ID`。
- 图案可以水平镜像增加变化，但不能纵向翻转；爱心、问号、箭头这类方向性图案不能被随机破坏语义。
- 卡面元信息属于 card 数据：左上品牌为 `Todaycard.app`，左下固定显示 `Choice A-D` 选项编号，右下日期只显示 `06/22` 这种月日格式。
- 卡片背面默认朝上并展示 sealed stamp，答案只在点击后翻出的正面出现。
- 卡片边缘不使用齿孔小圆点，靠圆角、边框、阴影和轻纸面纹理建立质感。
- 移动端必须使用 safe-area aware 的一屏 App Shell：`html/body` 不产生纵向滚动，标题、牌堆、输入框和源仓库链接在一个视口内完成空间分配。
- 移动端牌堆使用 full-bleed 舞台并独占触摸手势：`.deck-shell` 不把竖向手势交给页面滚动，当前卡、输入框和按钮不得被左右裁切。
- 移动端 full-bleed 舞台必须以 `.app` 的水平 padding 反推宽度和边距，不能在带 padding 的嵌套容器中使用 `100vw + calc(50% - 50vw)` 逃逸，否则 iOS Safari 会产生中轴漂移。
- 牌堆必须按循环 carousel 计算相对位置，`Choice A` 左侧是 `Choice D`，消除第一张/最后一张的边界偏斜。
- 只有点击当前聚焦卡片才翻牌；点击非当前卡片或当前卡左右外侧只切换聚焦卡，不得顺手翻牌。
- 成功滑动切牌必须播放轻量切牌音效；成功滑动切牌和成功翻牌应调用轻量 `navigator.vibrate()` 反馈，iOS Safari 等不支持 Web Vibration API 的浏览器静默降级。
- 桌面端 hover 轻微上浮作为点击反馈；不保留辅助翻牌按钮。
- 桌面端键盘只保留 ArrowLeft/ArrowRight 切牌、Enter/Space 翻当前卡，并阻止空格滚动页面。
- 翻牌不能重绘替换 DOM，必须给目标卡原地加 `.is-flipped` 播放旋转，且旋转主体是整张 `.card-inner`，不是只翻内容区。
- 移动端翻牌必须显式使用 `-webkit-perspective`、`-webkit-transform-style`、`-webkit-backface-visibility` 和轻微 `translateZ` 分层，防止正反面重影或镜像字泄露。
- 拖动期间关闭卡片 transition，pointermove 只通过 requestAnimationFrame 刷新位置。
- Cloudflare Pages 公开输出必须来自 `dist/`；只发布 `index.html`、`styles.css`、`data.js`、`audio.js`、`app.js`、`robots.txt`、`sitemap.xml`、`site.webmanifest`、`assets/todaycard.svg` 和 `assets/og.svg`，`skills/`、`CLAUDE.md`、`AGENTS.md` 和 references 只进仓库，不进站点。
- Cloudflare Pages Functions 来自 `functions/`，不进入 `dist/`，但随仓库部署为同源 `/api/*`。
- 单 HTML 交付从 `skills/todaycard/assets/todaycard-single.html` 复制，不反向替代 `index.html`、`styles.css`、`data.js`、`audio.js`、`app.js` 五文件源码真相。
- 任何改变页面结构、视觉、交互、卡片数据、默认文案或前端 API 边界的修改，都必须同步刷新 `skills/todaycard/assets/todaycard-single.html`。
- 同步单 HTML 时若出现语义冲突、能力差异或不确定取舍，必须停止并询问用户，不得自行猜测。
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
- 2026-06-23: 将 split source 变更必须同步 skill 单 HTML 模板写入硬规则。
- 2026-06-23: 明确单 HTML 同步遇到冲突时必须先询问用户。
- 2026-06-23: 新增 `assets/todaycard.svg` 作为 favicon，并让 dist 构建只发布该公开资产。
- 2026-06-23: 将翻牌音效升级为 Sensory UI `arcade` / `hero.milestone` 思路的 8-bit 分层 Hero Moment，不再依赖音频文件。
- 2026-06-23: 删除自定义选项 UI 和前端分支，输入面收敛为单句决策题。
- 2026-06-23: 新增 `audio.js` 声音层，抽卡、发牌、翻牌三段仪式音效从 app.js 中解耦。
- 2026-06-23: 将控制区改成票据式输入和紧凑游戏化抽卡按钮，并让抽卡后逐张发牌进入 coverflow。
- 2026-06-23: 将控制区升级为移动端胶囊输入和圆形抽卡按钮，背景改为暖纸面层次，并用 `.deal-motion` 隔离发牌动效解决重影。
- 2026-06-23: 按用户反馈撤回暖纸胶囊皮肤，恢复淡彩灰格、黑白票据行和小黑抽卡按钮，保留 `.deal-motion` 发牌隔离层。
- 2026-06-23: 将输入改回标题加大圆框组件，placeholder 改为 `今天想决定什么？`，抽卡按钮改为开关式状态控件并加入轻量 i18n。
- 2026-06-23: 新增 `data.js` 数据层，将 palette、署名和图案从 app.js 拆出；扩展为 20 个收藏卡色和 16 个图案，并保证同组不撞色。
- 2026-06-23: 移除决策输入上方标题，只保留大圆框 placeholder 与无障碍 aria-label。
- 2026-06-23: 将抽卡控件收敛为输入框右侧无文字圆形游戏按钮，并把 palette 提升到更吸睛的收藏卡亮色强度。
- 2026-06-24: 将页面背景还原为线上 TodayCard 的白底三色径向渐变，移除灰格叠层。
- 2026-06-24: 将抽卡控件从圆形图标球改为输入框右侧文字按钮，删除顶部横线和白牌 glyph。
- 2026-06-24: 新增低对比 GitHub 源仓库链接，收敛为灰色页脚元信息。
- 2026-06-24: 下移源仓库链接并减细字重，保持无图标文字链接。
- 2026-06-24: 恢复淡彩灰格背景和无文字圆形游戏按钮，并把 palette 收敛为青春可爱明亮 candy 色。
- 2026-06-24: 将 candy palette 的有色格与边框饱和度上调约 20%，保留浅底格和纸面轻盈感。
- 2026-06-24: 给 palette 增加 family 语义，同一组抽卡禁止重复色相家族，避免两张紫卡同时出现。
- 2026-06-24: 将 10x10 图案源改为具象可爱符号，移除抽象几何 preset。
- 2026-06-24: 按最新反馈恢复按钮状态文案，默认显示“抽卡”，发牌时显示“发牌中”。
- 2026-06-24: 答案页改为复用默认正面的 10x10 图案但只画实色块，默认正面恢复原浅底网格。
- 2026-06-24: 将 card mark/frame 的 candy palette 饱和度再提升约 20%，保持白纸面不变。
- 2026-06-24: 将卡片左下角从随机 seeded 署名改为固定 `Choice A-D` 选项编号，删除无意义情绪签名。
- 2026-06-24: 收紧移动端视口约束，消除 body 横向溢出、固定 coverflow spread 和抽卡按钮贴边裁切。
- 2026-06-24: 按移动端最佳实践下移内容、拆分选卡与翻牌热区，并给滑动和翻牌加入轻震反馈。
- 2026-06-24: 给移动端牌堆增加纵向裁剪缓冲、下沉当前卡并拉高 deck 节奏，避免卡片上沿被 stage 切掉和底部留白过大。
- 2026-06-24: 回退移动端牌堆操作框收口，恢复 full-bleed 牌堆，同时保留源仓库链接下移。
- 2026-06-24: 将移动端收敛为一屏锁定 App Shell，禁止页面纵向滚动并让牌堆独占触摸手势，避免滚动与翻牌/滑牌打架。
- 2026-06-24: 将移动端牌堆舞台改为 `.app` 同源中轴，并把 coverflow 改成循环布局，修复 iPhone Safari 左右偏轴和边界裁切感。
- 2026-06-24: 新增滑卡切牌 Web Audio 反馈，iPhone Safari 无 Web Vibration API 时仍有明确滑动反馈。
- 2026-06-24: 新增 SEO/OG/JSON-LD 元信息、robots、sitemap、manifest 和公开社交预览图。
- 2026-06-24: 新增 README 项目入口，使用 shieldcn badge/header，并记录本地运行、Dify、部署和 skill 边界。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
