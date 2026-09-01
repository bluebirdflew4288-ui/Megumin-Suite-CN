# Megumin-Suite 简体中文本地化说明

> 本文件是中文版本的维护手册。只翻译 UI 显示层；Prompt、逻辑、identifier 一律不动。

## 1. 官方 upstream

- 仓库：`https://github.com/Arif-salah/Megumin-Suite`
- 本地化基准分支：`main`
- 本地化分支：`localization/zh-cn`
- Base commit：`0376573`（Add files via upload，v10.0）
- 说明：本仓库 main 分支即 V10 源码；本地化基于该 commit，未做功能改动。

## 2. 中文化文件列表（33 个，均为 UI / 显示层）

| 类别 | 文件 |
|---|---|
| 入口与示例 | `index.js`、`example.html` |
| 主面板 | `src/ui/tabs.js`、`src/ui/tabs/coreAndCot.js`、`src/ui/tabs/globalAndBlocks.js`、`src/ui/tabs/globalSettings.js`、`src/ui/tabs/personality.js`、`src/ui/tabs/sidePanelTab.js` |
| 开发模式 | `src/ui/devmode.js`、`src/ui/progress.js`、`src/ui/promptEditor.js` |
| 侧边面板 | `src/sidepanel/panel.js`、`sections.js`、`presentBar.js`、`chrome.js` |
| 功能页 | `src/features/storyconfig/config.js`、`storyconfig/ui.js`、`storyplan/ui.js`、`banlist/ui.js`、`npc/ui.js`、`blocks/ui.js`、`imagegen/index.js`、`memory/index.js` |
| 数据显示 | `data/addons.js`、`data/blocks.js`、`data/directStyles.js`、`data/image_data.js`、`data/modes/legacy.js`、`data/modes/v7.js`、`data/modes/v10.js`、`data/personalities.js`、`data/slots.js`、`data/toggles.js` |

## 3. 允许翻译（仅显示层）

- `prompts[].name` 类显示名、`label`/`displayName`（**仅当与 id/key 分离**）
- `desc`/`description`/`hint`/`tooltip`/`placeholder`/`title`（显示用途）
- HTML 标签内可见文本、按钮文字、toastr/confirm/prompt 文本
- `directStyles.name/desc`、`slots.label`、`image_data.desc`、`RESOLUTIONS.label` 括号说明
- Engine label 的**功能性后缀**（如 `Co-writer → 联合编剧`）；`V4/V5/V6` 前缀必须保留（`label.includes("V4")` 版本分类逻辑）

## 4. 禁止修改（保持官方原样）

- 所有 Prompt 正文：`content`、`rule`、`notes`、`p1-p6`、`A1/A2`、`prefill`、`fallback`、`aiNote`、`value`、`legacy`、`defaultAliases`
- 所有 identifier：`id`、`key`、`trigger`、`tag`、UUID、`character_id`、`sessionId`
- 存储键：`localStorage`/`extension_settings`/profile 键、`globalSyncTabs` 键（tab title）
- 事件名、函数名、CSS class、HTML id、DOM selector、`data-*` 键
- `manifest.json` 全部字段；`generate_interceptor`、hook 注册、prompt 注入逻辑
- **`src/core/*`、`src/engine/*`、`src/prompts/*`、`src/utils/*`、`data/cot/*`、`Presets/*`：零修改**
- **`tabs.js` 的 tab `title`**（12 个）与 `src/core/sync.js` 的键：双角色（显示 + 同步键/持久化键），保留英文
- **CoT 无独立显示名**（id 兼作 Dev Mode 下拉文本）：`data/cot/*` 保留
- **Story Config 的 chips**：值即写入字段（进 Prompt），保留英文
- **SD_FLAVORS 风味标签**：值进 Prompt，保留英文
- **`styles.js` tag id / `styleTemplates.tags`**：双角色（显示 + 引用 + 拼入生成指令），保留英文
- **`skeleton.js` / `prompts/storage.js` 的 name**：与用户预设 prompt name 匹配，保留英文
- Engine 专名：Ukiyo、Shura、Mirage、Xin、Kuromaku、Cui、Kismet、Obsidian、Dream Team 等保留
- 技术缩写：CoT、NPC、OOC、LoRA、CFG、CLIP、Booru 等保留

## 5. 中文术语表（统一）

| 英文 | 中文 |
|---|---|
| Presets & CoT | 预设与思维链 |
| Engine | 引擎 |
| Reasoning / Chain of Thought | 推理 / 思维链 |
| Story Config | 故事设置 |
| Story Director | 故事导演 |
| Blocks | 信息块 |
| NPC Bank | NPC 图鉴 |
| Memory Core / Vault | 记忆核心 / 记忆库 |
| Side Panel | 侧边面板 |
| Dev Mode | 开发模式 |
| Global | 全局 |
| Persona | 人设 |
| Writing Style | 写作风格 |
| Ban List | 屏蔽列表 |
| Save & Close | 保存并关闭 |
| Pro Tip | 使用提示 |
| Add-ons | 附加组件 |
| Enhanced Dialogue | 增强对话 |
| Co-writer | 联合编剧 |
| Reset | 重置 |
| Enabled/Disabled | 已启用/已禁用 |

## 6. 更新时重新检查的方法

官方更新后：

1. 将 upstream 合并/变基到 `localization/zh-cn`（处理冲突）；
2. 用 git diff 对比新引入的英文 UI 字符串，按 §3/§4 规则翻译；
3. 重新运行验收（§7）。

## 7. 验收命令

```bash
# 1) JS 语法
for f in $(git diff --name-only -- '*.js'); do node --check "$f" || exit 1; done

# 2) Prompt/逻辑文件零修改
git diff --name-only | grep -iE "Presets/|manifest|data/prompts|data/cot|src/core/|src/engine/|src/utils/|src/st.js|src/prompts" && exit 1 || echo OK

# 3) id/key 一致性（删除行与新增行的 id/key 值集合必须相同）
git diff -U0 | python3 scripts/check-localization.py

# 4) 翻译残留（允许命中：src/core 注释/键、故意保留项）
grep -rn "Official Megumin Engines\|Save & Close" src/ index.js example.html | grep -v "\.py:"
```

## 8. 与官方版并存

**不推荐同时启用**（见报告第十五节）：两版使用相同的 `extensionName` 与 `generate_interceptor`（`megumin_memory_intercept`）、相同的全局键与 DOM 挂载点，并存会产生重复监听与冲突。中文版应替换官方版安装，或改在独立 SillyTavern 实例中使用。
