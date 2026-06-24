<!--
[INPUT]: 依赖 GitHub 仓库 hiyeshu/todaycard、`npx skills` 本地安装目录和 TodayCard skill 文件清单
[OUTPUT]: 对外提供安装完整性查漏流程、必查文件清单、快速命令、残缺包判断和修复路径
[POS]: skills/todaycard/references 的安装完整性协议，被 SKILL.md 在安装、缺文件、模板不可用或 skill 加载异常场景读取
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# install-check.md

用途：确认 TodayCard skill 是否完整安装。安装命令成功只说明入口被发现，不说明模板、资产和契约都到位。

阅读本文件不等于每次都执行查漏。只有用户表达“安装后不可用、文件不足、模板缺失、skill 没加载、README 路径对不上、单 HTML 找不到、页面跑不起来、想检查安装完整性”时，先查完整性，再继续构建或修改。

## 对照源

默认对照当前仓库或 GitHub：

```text
https://github.com/hiyeshu/todaycard
```

不要凭记忆补写 `.html`、`.js`、`.png` 或长模板。机器文件缺失时，重新安装、clone 或从可信仓库同步。

## 定位顺序

1. 用户给了路径：直接检查该目录。
2. 当前目录含 `skills/todaycard/SKILL.md`：以仓库根为源，检查 `skills/todaycard/`。
3. 当前目录含 `SKILL.md` 且 name 是 `todaycard`：以当前目录为 skill 根。
4. 可运行 `npx skills list -g --json`：从结果里找 `todaycard` 的安装路径。
5. 常见兜底：检查 `~/.codex/skills/todaycard`、`~/.agents/skills/todaycard`、`~/.claude/skills/todaycard`。

以上都失败时，只问一句要检查的安装路径。

## 必查文件

从 skill 根目录检查：

```text
SKILL.md
CLAUDE.md
agents/openai.yaml
assets/CLAUDE.md
assets/patterns.md
assets/todaycard-single.html
references/CLAUDE.md
references/install-check.md
references/todaycard-contract.md
```

没有上游文件的类别不算缺失。比如 GitHub 当前 skill 目录没有 shell 脚本，本地没有 `.sh` 就不是问题。

## 快速命令

在仓库根目录：

```bash
npx skills@latest add . --list
test -f skills/todaycard/SKILL.md
test -f skills/todaycard/assets/todaycard-single.html
test -f skills/todaycard/references/install-check.md
test -f skills/todaycard/references/todaycard-contract.md
```

在已安装的 skill 根目录：

```bash
test -f SKILL.md
test -f agents/openai.yaml
test -f assets/patterns.md
test -f assets/todaycard-single.html
test -f references/install-check.md
test -f references/todaycard-contract.md
```

需要完整差异时：

```bash
find . -maxdepth 3 -type f | sort
```

## 修复路径

- Markdown、说明或路由文字过时：直接修文档，随后检查 `[PROTOCOL]` 和对应 `CLAUDE.md`。
- 安装目录缺少上游文件：优先重新安装或从完整 clone 同步，不手写空壳。
- 只想体验产品：可以直接打开 https://todaycard.app/，但这不替代 skill 完整性修复。
- 需要完整源码或怀疑 `npx skills` 丢文件：直接 clone 仓库。

重新安装：

```bash
npx skills add hiyeshu/todaycard
```

完整源码：

```bash
git clone https://github.com/hiyeshu/todaycard.git
```

## 输出格式

检查后只输出三段：

```text
完整性：通过 / 不通过
缺失项：列出文件或目录
下一步：重新安装 / clone / 可以继续运行 / 直接访问 https://todaycard.app/
```
