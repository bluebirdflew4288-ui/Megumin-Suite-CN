// ────────────────────────────────────────────────────────────────────────────
// Global Toggles & Blocks — add-ons, language, and block membership.
// ────────────────────────────────────────────────────────────────────────────

import { Popup, POPUP_TYPE } from "../../st.js";
import { localProfile, currentTab } from "../../core/state.js";
import { extension_settings } from "../../st.js";
import { extensionName } from "../../core/constants.js";
import { saveProfileToMemory, saveProfileDebounced } from "../../core/profile.js";
import { fireRefreshHook, REFRESH } from "../../core/refreshHooks.js";
import { hardcodedLogic } from "../../../data/database.js";
import { meguminSlotByTrigger } from "../../../data/slots.js";
import { hasSharedFragment } from "../../core/sharedFragments.js";
import { engineUsesRenderLimits } from "../../core/engines.js";

// "You have rewritten this one in Dev Mode."
//
// An add-on card said only whether the add-on was ON. It could not say that the
// text behind it was no longer the shipped text, so a reader who reworded the
// ban list six weeks ago had no way to be reminded of it from the screen where
// they switch it on -- and when the output looked wrong, the edit they had
// forgotten was invisible.
//
// The link between a card and its slot is the trigger both already carry
// ([[Direct]], [[html]], [[MVU]] ...), so this needs no lookup table to fall out
// of date. Two dice add-ons share [[dice]] and both light up, which is right:
// the one edit applies to whichever variant is switched on.
function customBadge(triggerOwner) {
    const slot = meguminSlotByTrigger(triggerOwner && triggerOwner.trigger);
    if (!slot || !slot.key || !hasSharedFragment(slot.key)) return "";
    return `<span class="ecard-badge custom" title="你在开发模式中编辑过此内容。它不再使用内置文本。"><i class="fa-solid fa-pen"></i> 自定义</span>`;
}

export function renderGlobalAndBlocks(c) {
    c.empty();

    const addonDescriptions = {
        "death": "启用永久性后果。角色——包括你——真的会死亡。没有安全网，没有主角光环。",
        "combat": "激活脚踏实地、战术性的战斗层。行动有真实分量，站位很重要，你可能会输得很惨。",
        "direct": "迫使 AI 直说 D 和 P 这类词。不绕弯子，不礼貌回避。你懂的。<b>V10 上不需要</b>——该引擎本来就这么写，开启它只会重复指令。",
        "color": "每个角色的对话都有颜色标识，便于视觉解析。",
        "npc_events": "要求所有新故事事件都从先前上下文或环境线索中自然生长——不凭空制造随机剧情。仅 V6。",
        "dn": "强制对话与旁白分别包裹在各自的 XML 标签中。对特定模型更好地遵循旁白风格有用。<b>V10 上不推荐</b>——标签会与该引擎自身的行文规则冲突。",
        "html": "当角色阅读某样东西——手机屏幕、信件、招牌——AI 直接用 HTML 画出它，而非描述。刻意少见：每条回复至多一个，多数回复没有。",
        "dice_all": "同一套 d20 系统，但所有人掷骰——NPC 也不例外。任何尝试可能失败之事的角色都会掷骰，且全部列在回复之前。使用此功能或 Dice，不要两者并用。",
        "dice": "由 d20 决定冒险尝试是否成功。AI 在写场景前先掷骰，因此故事跟随骰子，而非骰子跟随故事。掷骰结果在信息块卡片上有独立标签页。"
    };

    // Only MVU is left in this tab's Output Formats section, so only MVU needs a line
    // here. The tracker blocks' descriptions moved onto MEGUMIN_BLOCK_REGISTRY as `desc`
    // when they moved to the BLOCKS tab -- they were sitting here unreachable, because
    // the section below filters to mvu and nothing else ever reached this map.
    const blockDescriptions = {
        "mvu": "添加 MVU 兼容性（仍在测试中），了解更多请访问：<a href='https://github.com/KritBlade/MVU_Game_Maker' target='_blank' style='color: var(--gold); text-decoration: underline;'>https://github.com/KritBlade/MVU_Game_Maker</a>"
    };

    const activeMode = [...hardcodedLogic.modes, ...(extension_settings[extensionName].customModes || [])].find(m => m.id === localProfile.mode);
    const isV6 = activeMode && (activeMode.id.includes("v6") || activeMode.label.includes("V6"));
    // Asked for by behaviour, not by generation: the Lean/Full split is the one thing
    // V10 does not inherit from V9, and naming it that way keeps the next generation
    // from having to be excluded here by hand.
    const isV9 = engineUsesRenderLimits(activeMode);

    // ── UNIFIED HEADER ──
    c.append(`
        <div class="mtab-header">
            <div class="mtab-header-left">
                <div class="mtab-header-icon" style="background: linear-gradient(135deg, #3b82f6, #10b981);">
                    <i class="fa-solid fa-earth-americas"></i>
                </div>
                <div>
                    <h2>全局开关与信息块</h2>
                    <p>配置全局参数、玩法附加组件与 UI 追踪信息块。</p>
                </div>
            </div>
            <div class="mtab-header-badge" style="background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.25);">
                <i class="fa-solid fa-gears" style="font-size:0.6rem;"></i> ${localProfile.addons.length + localProfile.blocks.length} 个已启用模块
            </div>
        </div>
    `);

    // ── HINT ──
    c.append(`
        <div class="mtab-callout blue" style="margin-bottom: 20px;">
            <i class="fa-solid fa-circle-info"></i>
            <span><strong>你知道吗？</strong>全局偏好设置每个引擎都会读取的语言与代词。玩法附加组件把额外系统挂到故事上——骰子、死亡、战斗、HTML 道具。输出格式只是 MVU，即与另一个扩展的兼容契约。追踪信息块位于 <b>信息块</b> 标签页，而不是这里。</span>
        </div>
    `);

    // ==========================================
    // ── 1. GLOBAL PREFERENCES ──
    // ==========================================
    c.append(`<div class="wstyle-section-head blue"><i class="fa-solid fa-sliders"></i> 全局偏好</div>`);
    
    const extraPanel = $(`
        <div class="mtab-panel" style="margin-bottom: 24px;">
            ${isV9 ? `
            <div class="mtab-setting-row" style="flex-direction: column; align-items: stretch; gap: 10px;">
                <div class="set-info">
                    <div class="set-label" style="color: #f43f5e;"><i class="fa-solid fa-layer-group"></i> V9 动态渲染限制</div>
                    <div class="set-desc">V9 在精简（快速互动）与完整（深度场景）之间切换。为两者分别设置词数范围。</div>
                </div>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="font-size: 0.7rem; font-weight: bold; color: var(--text-muted); margin-bottom: 2px;">精简渲染</div>
                        <div style="font-size: 0.6rem; color: #a855f7; margin-bottom: 6px; line-height: 1.2;">由 AI 为快速对话、你来我往的争论与快捷行动而触发。</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="number" id="ps_v9_lean_min" class="ps-modern-input" style="width: 100%; text-align: center;" value="${localProfile.v9Limits.leanMin}" />
                            <span style="color: var(--text-muted);">to</span>
                            <input type="number" id="ps_v9_lean_max" class="ps-modern-input" style="width: 100%; text-align: center;" value="${localProfile.v9Limits.leanMax}" />
                        </div>
                    </div>
                    <div style="flex: 1; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="font-size: 0.7rem; font-weight: bold; color: var(--text-muted); margin-bottom: 2px;">完整渲染</div>
                        <div style="font-size: 0.6rem; color: #10b981; margin-bottom: 6px; line-height: 1.2;">由 AI 为场景切换、深度沉浸与重大剧情事件而触发。</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="number" id="ps_v9_full_min" class="ps-modern-input" style="width: 100%; text-align: center;" value="${localProfile.v9Limits.fullMin}" />
                            <span style="color: var(--text-muted);">to</span>
                            <input type="number" id="ps_v9_full_max" class="ps-modern-input" style="width: 100%; text-align: center;" value="${localProfile.v9Limits.fullMax}" />
                        </div>
                    </div>
                </div>
            </div>
            ` : ``}
            <div class="mtab-setting-row">
                <div class="set-info"><div class="set-label">语言输出</div><div class="set-desc">留空则使用默认（英语）</div></div>
                <input type="text" id="ps_input_language" class="ps-modern-input" style="width: 180px;" placeholder="例如：阿拉伯语、法语…" value="${localProfile.userLanguage || ''}" />
            </div>
            <div class="mtab-setting-row">
                <div class="set-info"><div class="set-label">用户性别</div><div class="set-desc">确保 AI 正确称呼你</div></div>
                <select id="ps_select_pronouns" class="ps-modern-input" style="width: 180px; cursor: pointer;">
                    <option value="off" ${localProfile.userPronouns === 'off' ? 'selected' : ''}>关闭</option>
                    <option value="male" ${localProfile.userPronouns === 'male' ? 'selected' : ''}>男性（他）</option>
                    <option value="female" ${localProfile.userPronouns === 'female' ? 'selected' : ''}>女性（她）</option>
                </select>
            </div>
        </div>
    `);
    c.append(extraPanel);

    $("#ps_v9_lean_min").on("input", function () { localProfile.v9Limits.leanMin = parseInt($(this).val()) || 300; saveProfileDebounced(); });
    $("#ps_v9_lean_max").on("input", function () { localProfile.v9Limits.leanMax = parseInt($(this).val()) || 400; saveProfileDebounced(); });
    $("#ps_v9_full_min").on("input", function () { localProfile.v9Limits.fullMin = parseInt($(this).val()) || 700; saveProfileDebounced(); });
    $("#ps_v9_full_max").on("input", function () { localProfile.v9Limits.fullMax = parseInt($(this).val()) || 1200; saveProfileDebounced(); });
    $("#ps_input_language").on("input", function () { localProfile.userLanguage = $(this).val(); saveProfileDebounced(); });
    $("#ps_select_pronouns").on("change", function () { localProfile.userPronouns = $(this).val(); saveProfileToMemory(); });

    // ==========================================
    // ── 2. GAMEPLAY ADD-ONS ──
    // ==========================================
    c.append(`<div class="wstyle-section-head blue"><i class="fa-solid fa-puzzle-piece"></i> 玩法附加组件</div>`);
    c.append(`
        <div class="mtab-callout gold" style="margin-bottom: 16px;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>只挑你真正想要的三四个，而不是全部。每个附加组件都是模型写作时必须记在心上的又一套系统，超过一定数量后，注意力转向记账，行文就会变薄。少而精，读起来更好。</span>
        </div>
    `);
    const addonGrid = $(`<div class="mtab-card-grid" style="margin-bottom: 24px;"></div>`);

    hardcodedLogic.addons.forEach(a => {
        const isSel = localProfile.addons.includes(a.id);
        let badges = '';
        if (a.recommended) badges += `<span class="ecard-badge rec"><i class="fa-solid fa-star"></i> Recommended</span>`;
        badges += customBadge(a);

        let extraClass = '';
        let v6BadgeHtml = '';
        if (a.id === "npc_events") {
            if (!isV6) {
                extraClass = 'locked-card';
                v6BadgeHtml = `<span class="ecard-badge" style="background:rgba(239,68,68,0.12);color:#ef4444;"><i class="fa-solid fa-lock"></i> Requires V6</span>`;
            } else {
                v6BadgeHtml = `<span class="ecard-badge v6-active"><i class="fa-solid fa-unlock"></i> V6 Active</span>`;
            }
        }

        const card = $(`
            <div class="mtab-eng-card ${isSel ? 'active' : ''} ${extraClass}">
                <div class="ecard-accent"></div>
                <div class="ecard-body">
                    <div class="ecard-title">
                        <span>${a.label}</span>
                        ${isSel ? `<span class="ecard-badge" style="background:rgba(16,185,129,0.15);color:#10b981;"><i class="fa-solid fa-check"></i> On</span>` : ''}
                    </div>
                    <p class="ecard-desc">${addonDescriptions[a.id] || ""}</p>
                    ${badges || v6BadgeHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${badges}${v6BadgeHtml}</div>` : ''}
                </div>
            </div>
        `);

        card.on("click", () => {
            if (isSel) {
                localProfile.addons = localProfile.addons.filter(i => i !== a.id);
            } else {
                // Two add-ons in the same `exclusive` group write to the same
                // prompt anchor, so switching to one has to switch the other
                // off — otherwise whichever the loop reached last would win and
                // the toggles would disagree with what was actually sent.
                if (a.exclusive) {
                    const rivals = hardcodedLogic.addons
                        .filter(o => o.id !== a.id && o.exclusive === a.exclusive)
                        .map(o => o.id);
                    localProfile.addons = localProfile.addons.filter(i => !rivals.includes(i));
                }
                localProfile.addons.push(a.id);
            }
            saveProfileToMemory(); fireRefreshHook(REFRESH.SWITCH_TAB);
        }); 
        addonGrid.append(card);
    });

    if (!localProfile.onomatopoeia) localProfile.onomatopoeia = { enabled: false, useStyling: false };
    const isOno = localProfile.onomatopoeia.enabled;
    const isOnoStyle = localProfile.onomatopoeia.useStyling;

    const onoCard = $(`
        <div class="mtab-eng-card ${isOno ? 'active' : ''}">
            <div class="ecard-accent"></div>
            <div class="ecard-body">
                <div class="ecard-title">
                    <span>影视音效</span>
                    ${isOno ? `<span class="ecard-badge" style="background:rgba(16,185,129,0.15);color:#10b981;"><i class="fa-solid fa-check"></i> On</span>` : ''}
                    ${customBadge({ trigger: "[[onomato]]" })}
                </div>
                <p class="ecard-desc">强制 AI 使用精确的拟声词（例如 click、thud）而非抽象描述。</p>
                <div style="display: ${isOno ? 'flex' : 'none'}; margin-top: 8px; padding-top: 10px; border-top: 1px dashed var(--border-color); justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight:700; font-size: 0.75rem; color: var(--text-main);">动态音效</div>
                        <div style="font-size: 0.65rem; color: var(--text-muted);">用 HTML 标签包裹。仅限能力足够的 AI。</div>
                    </div>
                    <div class="ps-toggle-card ${isOnoStyle ? 'active' : ''}" id="ono_inner_toggle" style="padding: 4px; min-width: 44px; justify-content: center; background: transparent; border-color: ${isOnoStyle ? '#10b981' : 'var(--border-color)'};">
                        <div class="ps-switch" style="transform: scale(0.75); ${isOnoStyle ? 'background: #10b981;' : ''}"></div>
                    </div>
                </div>
            </div>
        </div>
    `);
    onoCard.on("click", (e) => {
        if ($(e.target).closest("#ono_inner_toggle").length) {
            localProfile.onomatopoeia.useStyling = !localProfile.onomatopoeia.useStyling;
            saveProfileToMemory(); fireRefreshHook(REFRESH.SWITCH_TAB); return;
        }
        localProfile.onomatopoeia.enabled = !localProfile.onomatopoeia.enabled;
        saveProfileToMemory(); fireRefreshHook(REFRESH.SWITCH_TAB);
    });
    addonGrid.append(onoCard);
    c.append(addonGrid);

    // Custom Engine Settings (Addons)
    if (activeMode && activeMode.customToggles) {
        const customSettings = activeMode.customToggles.filter(t => t.location === "settings");
        if (customSettings.length > 0) {
            const toggleList = $(`<div class="mtab-card-list" style="margin-bottom: 24px;"></div>`);
            customSettings.forEach(cs => {
                const isSel = !!localProfile.toggles[cs.id];
                const tCard = $(`
                    <div class="mtab-toggle-row ${isSel ? 'active' : ''}" style="${isSel ? 'border-color:#10b981;' : ''}">
                        <div class="toggle-info">
                            <div class="toggle-label" style="${isSel ? 'color:#10b981;' : ''}">${cs.name}</div>
                            <div class="toggle-desc">自定义模块 → [[${cs.attachPoint}]]</div>
                        </div>
                        <div class="ps-switch" style="${isSel ? 'background:#10b981;' : ''}"></div>
                    </div>
                `);
                tCard.on("click", () => { localProfile.toggles[cs.id] = !localProfile.toggles[cs.id]; saveProfileToMemory(); fireRefreshHook(REFRESH.SWITCH_TAB); });
                toggleList.append(tCard);
            });
            c.append(toggleList);
        }
    }

    // ── OUTPUT FORMATS ──
    // Everything the reader sees as a block lives in the BLOCKS tab. What stays
    // here is MVU, which is not a tracker at all but a contract with another
    // extension, and never enters the envelope.
    c.append(`<div class="wstyle-section-head green"><i class="fa-solid fa-cubes"></i> 输出格式</div>`);
    const formatGrid = $(`<div class="mtab-card-grid"></div>`);

    hardcodedLogic.blocks.filter(b => b.id === "mvu").forEach(b => {
        const isSel = localProfile.blocks.includes(b.id);
        const isOverridden = activeMode && activeMode[b.id] && activeMode[b.id].trim() !== "";
        const card = $(`
            <div class="mtab-eng-card ${isSel ? 'active' : ''}">
                <div class="ecard-accent"></div>
                <div class="ecard-body">
                    <div class="ecard-title">
                        <span>${b.label}</span>
                        ${isSel ? `<span class="ecard-badge" style="background:rgba(16,185,129,0.15);color:#10b981;"><i class="fa-solid fa-check"></i> On</span>` : ''}
                        ${customBadge(b)}
                    </div>
                    <p class="ecard-desc">${blockDescriptions[b.id] || ""}</p>
                    ${isOverridden ? `<div style="margin-top:4px;"><span class="ecard-badge override"><i class="fa-solid fa-code-branch"></i> 引擎覆盖</span></div>` : ''}
                </div>
            </div>
        `);
        card.on("click", () => {
            if (isSel) localProfile.blocks = localProfile.blocks.filter(i => i !== b.id);
            else localProfile.blocks.push(b.id);
            saveProfileToMemory(); fireRefreshHook(REFRESH.SWITCH_TAB);
        });
        formatGrid.append(card);
    });
    c.append(formatGrid);
}
