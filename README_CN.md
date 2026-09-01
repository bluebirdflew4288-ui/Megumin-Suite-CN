# Megumin Suite 中文本地化版

本仓库是 [Arif-salah/Megumin-Suite](https://github.com/Arif-salah/Megumin-Suite) 的**非官方简体中文 UI 本地化版本**。

## 声明

- 本仓库为**非官方**简体中文本地化版本，不代表原作者（KazumaONIISAN / Arif-salah）背书。
- 官方项目：https://github.com/Arif-salah/Megumin-Suite
- 修改范围：**仅 UI 显示层文案**——扩展控制面板、设置项、按钮、提示、Engine 描述等用户可见文字。
- 保持不变：**Prompt 正文、Engine 逻辑、Runtime identifiers、Preset 行为、API / storage / event keys、manifest.json** 均未改动。
- 许可证：遵循上游项目 **CC BY-NC 4.0**（Creative Commons Attribution-NonCommercial 4.0 International），保留原作者署名，禁止商业用途。
- 安装注意：**请勿与官方版同时启用**（两者使用相同的扩展标识与拦截器，无法共存）。

## 本地化范围

| 已汉化 | 保持不变 |
|---|---|
| 扩展控制面板（预设与思维链、官方引擎、自定义引擎、故事设置等） | Prompt 正文 |
| 设置项 / 按钮 / 开关 / 提示文字 | Engine 逻辑与 identifier |
| Engine 描述（V10 Ukiyo / V10 Shura 等说明） | Preset 行为 |
| 通知 / 确认框 / 状态文字 | API / storage / event keys |

## 维护

本地化维护说明见 [LOCALIZATION_NOTES.md](LOCALIZATION_NOTES.md)（术语表、允许/禁止修改字段、更新与验收方法）。

## 安装（SillyTavern）

```
Extensions → Install Extension
Git URL: https://github.com/<USER>/Megumin-Suite-CN
Branch:  main
```

安装前请先停用官方 Megumin Suite，避免冲突。

## License

本项目遵循上游 [License](License)（CC BY-NC 4.0）。原作者版权归 Arif-salah / KazumaONIISAN 所有。
