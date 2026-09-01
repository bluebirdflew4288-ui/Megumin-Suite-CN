// Identity constants. Kept apart from state.js because these never change at
// runtime, and because almost every module wants extensionName for the
// extension_settings lookup — importing that shouldn't drag mutable state along.

export const extensionName = "Megumin-Suite";
// 动态推导扩展目录（兼容任意安装目录名，如 Megumin-Suite-CN）。
// extensionName 必须保持不变（storage/事件键依赖），仅目录推导走真实 URL。
const _extensionBase = new URL("../../", import.meta.url);
export const extensionFolderPath = _extensionBase.pathname.replace(/^\//, "").replace(/\/$/, "");
export const TARGET_PRESET_NAME = "Megumin Engine";
