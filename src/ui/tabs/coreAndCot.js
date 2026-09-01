// ────────────────────────────────────────────────────────────────────────────
// Presets & COT — engine choice, chain-of-thought, thinking effort.
// ────────────────────────────────────────────────────────────────────────────

import { extension_settings, saveSettingsDebounced, Popup, POPUP_TYPE } from "../../st.js";
import { extensionName } from "../../core/constants.js";
import { localProfile, currentTab } from "../../core/state.js";
import { lockedStyleIdFor, isV7Engine, isV10Engine } from "../../core/engines.js";
import { saveProfileToMemory, saveProfileDebounced } from "../../core/profile.js";
import { fireRefreshHook, REFRESH } from "../../core/refreshHooks.js";
import { hardcodedLogic } from "../../../data/database.js";
import { renderDevMode } from "../devmode.js";
import { meguminCotForMode } from "../../../data/cot/index.js";
import { buildStoryConfigSection } from "../../features/storyconfig/ui.js";
import { countActiveConfigFields } from "../../features/storyconfig/config.js";

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced Dialogue — the switch drawn inside an engine card.
//
// It lives on the card rather than in the tab's own toggle strip because it
// belongs to the engine: it replaces that engine's <dialogue> section and means
// nothing for any other generation. V10 only, because no other generation writes
// that tag and the switch would be inert.
//
// Two grids draw engine cards — the official list and the custom clones — and a
// Dev Mode clone of a V10 engine is still flagged isV10, so the switch has to
// appear on both. Written once here rather than twice inline: the first version
// of this was in the official card only, and the feature disappeared the moment
// anybody cloned an engine to edit it.
// ─────────────────────────────────────────────────────────────────────────────

function enhancedDialogueOn(m) {
    return Boolean(m && localProfile.enhancedDialogue && localProfile.enhancedDialogue[m.id]);
}

function enhancedDialogueMarkup(m, isLocked) {
    if (!isV10Engine(m) || isLocked) return "";
    const on = enhancedDialogueOn(m);
    return `
        <div class="ecard-opt ${on ? "on" : ""}" title="Swap this engine's dialogue rules for the stricter, prescriptive set: named categories, orthographic cues for emotion, and an explicit ban list. For models that read the shipped section as a suggestion.">
            <div class="ecard-opt-text">
                <span class="ecard-opt-label"><i class="fa-solid fa-comment-dots"></i> Enhanced Dialogue</span>
                <span class="ecard-opt-state">${on ? "On" : "Off"}</span>
            </div>
            <div class="ecard-opt-switch"></div>
        </div>`;
}

function wireEnhancedDialogue(card, m, rerender) {
    card.find(".ecard-opt").on("click", function (ev) {
        // Without this the click also selects the engine. Flipping a setting and
        // switching engine are separate intentions and the card must not conflate
        // them — the switch sits inside the card's own click target.
        ev.stopPropagation();
        if (!localProfile.enhancedDialogue) localProfile.enhancedDialogue = {};
        // Deleted rather than set false, so the map only ever holds engines that
        // are actually on and an untouched profile stays empty.
        if (localProfile.enhancedDialogue[m.id]) delete localProfile.enhancedDialogue[m.id];
        else localProfile.enhancedDialogue[m.id] = true;
        saveProfileToMemory();
        // The counter reads the engine's prompt through buildBaseDict, and the
        // two dialogue sections are different lengths.
        fireRefreshHook(REFRESH.TOKEN_COUNT);
        if (typeof rerender === "function") rerender();
    });
}

export function renderCoreAndCot(c) {
    // Preserve active sub-tab and filter before wiping the container
    let activeSubTab = c.find('.ws-nav-btn.active').attr('data-target') || 'sec-official';
    let activeFilter = c.find('.wstyle-filter-pill.active').attr('data-filter') || 'all';

    c.empty();
    const root = $(`<div style="display: flex; flex-direction: column; height: 100%;"></div>`);

    const descriptions = {
        "balance": "最初的秘制配方。NPC 反应自然——不献媚，也无无谓敌视。",
        "balance Test": "全新改进的平衡模式，旨在使用更少 token、带来更多创意。",
        "cinematic": "好莱坞式叙事。戏剧性节拍与张力拉满。",
        "dark": "平衡模式的更严酷版本。世界毫不留情，后果更加沉重。",
        "v6-anime-director": "高级电影化构图与节奏。旨在复刻高预算动画的导演水准。",
        "v6-dream-team": "终极 6 专家写作团队。前所未有的叙事一致性与真实感。",
        "v6-dream-team-lite": "梦之队的精简版。更快的生成与更低的 token 开销。",
        "v7-core": "V7 Core 引擎。完美的中间地带：电影化节奏、真实的摩擦感与不停歇的世界推进。",
        "v7-reality": "V7 Reality 引擎。脚踏实地、毫不留情的模拟，零叙事保护。",
        "v7-gentle": "V7 Gentle 引擎。更柔和、更私密的叙事流。",
        "v7.5": "Kismet 引擎。纯粹聚焦于不可逃脱的叙事动量，如同命运的无形作者推动故事前进。",
        "v8-m": "在复杂人类心理、真实有缺陷的对话，以及自主多层次剧情构建方面无与伦比。",
        "v8-lite": "Obsidian 的高效精简版。以轻得多的 token 占用保留心理、对话与动量的核心规则。",
        "v8-fusion": "Megumin Suite 的绝对巅峰。融合 V8 Obsidian 深层心理与 V6 梦之队专家写作团队框架的混合引擎。",
        "v10-core": "讲述者。Ukiyo 是二者中更自由的一个——一位有脾气的说书人，编织世界与历史，追随场景中最鲜活的东西。它以少许打磨换取创意：文字自由游走、捕捉意象，偶尔用力过猛。为氛围、动量与一个“被讲述出来”而非“被编排出来”的世界而选它。两款 V10 并非彼此的降级——各自试几场，留下听起来像你想读的故事的那一款。",
        "v10-shura": "写作者。Shura 是二者中更严格的一个——没有劣质文字、没有 AI 腔、没有为了管理场景而存在的句子。每个角色都是自己故事的主角，依自身价值观行动，没有人自认是反派；叙事无需站队的绝对对错。为读起来像书一般的文字、由群像自身驱动的故事而选它。两款 V10 并非彼此的降级——各自试几场，留下听起来像你想读的故事的那一款。",
        "v10-core-cw": "Ukiyo，同时由叙述者代写 {{user}}。它会读懂你的写作方式——措辞、节奏、你行动的大胆程度——并以那个声音扮演你的角色。你自己写的内容即为正典，永不被覆盖或修正。你的过往依然属于你；共享的只有演绎。",
        "v10-shura-cw": "Shura 的共著版本：每个角色都是主角，{{user}} 也在其中，叙述者以你的声音书写他们全部。当你收回回合时它会即刻让位，且从不虚构你的过去。适合放手式电影化游玩——观看故事，而非操控每个节拍。",
        "v9-core": "权威的、最终的 Megumin V9 预设。V9 Mirage 是叙事模拟的绝对巅峰，带来超真实心理、切肤的环境质感与动态的世界后果。这是终极且强烈推荐的预设。",
        "v9-lite": "实验性 beta 引擎，拥有略有不同、高度风格化的叙事流。事实证明它足够有趣，值得收录给想要另一种叙事节奏的人。注意：它不支持自定义写作风格，因为它有自己的一套。",
        "v9-director": "独特的 beta 混合引擎，融合 V8 Fusion 的专业写作团队机制与 V9 Xin 的原始心理深度。高度实验性。注意：它不支持自定义写作风格，因为它有自己的一套。",
        "v9-immersion": "V9 Mirage 的精简轻量版。保留 Mirage 的核心理念与残酷现实主义，但以更小的上下文占用运行。如果你的模型能承受，仍推荐 V9 Mirage。"
    };

    const activeEng = hardcodedLogic.modes.find(m => m.id === localProfile.mode);
    const activeLabel = activeEng ? activeEng.label : localProfile.mode;

    let v4Count = 0, v5Count = 0, v6Count = 0, v7Count = 0, v8Count = 0, v9Count = 0, v10Count = 0;
    hardcodedLogic.modes.forEach(m => {
        if (m.label.includes("V4")) v4Count++;
        else if (m.label.includes("V5")) v5Count++;
        else if (m.id.includes("v6")) v6Count++;
        else if (m.id.includes("v7")) v7Count++;
        else if (m.id.includes("v8")) v8Count++;
        else if (m.id.includes("v10")) v10Count++;
        else if (m.id.includes("v9")) v9Count++;
    });
    const totalCount = hardcodedLogic.modes.length;
    const customCount = (extension_settings[extensionName].customModes || []).length;

    // ── UNIFIED HEADER ──
    root.append(`
        <div class="wstyle-header">
            <div class="wstyle-header-left">
                <div class="wstyle-header-icon" style="background: linear-gradient(135deg, #f59e0b, #a855f7);">
                    <i class="fa-solid fa-server"></i>
                </div>
                <div>
                    <h2>预设与思维链</h2>
                    <p>选择核心预设与思维链。</p>
                </div>
            </div>
            <div class="wstyle-active-badge">
                <i class="fa-solid fa-circle-check"></i>
                ${activeLabel}
            </div>
        </div>
    `);

    // ── TWO COLUMN LAYOUT ──
    const layout = $(`<div class="ws-layout"></div>`);
    const sidebar = $(`<div class="ws-sidebar"></div>`);
    const mainArea = $(`<div class="ws-main"></div>`);

    // --- BUILD SIDEBAR ---
    sidebar.append(`<div class="ws-sidebar-title">配置</div>`);
    
    const btnOfficial = $(`<button class="ws-nav-btn active" data-target="sec-official"><span style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-server"></i> 官方引擎</span> <span class="ws-badge">${totalCount}</span></button>`);
    const btnCustom = $(`<button class="ws-nav-btn" data-target="sec-custom"><span style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-microchip"></i> 自定义引擎</span> <span class="ws-badge">${customCount}</span></button>`);
    
    sidebar.append(btnOfficial).append(btnCustom);
    sidebar.append(`<div style="height: 1px; background: var(--border-color); margin: 8px 0;"></div>`);
    
    const cfgCount = countActiveConfigFields(localProfile.storyConfig);
    const btnConfig = $(`<button class="ws-nav-btn" data-target="sec-config"><span style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-sliders" style="color: var(--gold);"></i> 故事设置</span> <span style="display:flex; align-items:center; gap:6px;"><span class="ws-new-pill">✨ 新</span>${cfgCount > 0 ? `<span class="ws-badge">${cfgCount}</span>` : ''}</span></button>`);
    sidebar.append(btnConfig);

    const btnCot = $(`<button class="ws-nav-btn" data-target="sec-cot"><span style="display:flex; align-items:center; gap:10px; color: ${localProfile.cotEnabled ? 'var(--text-main)' : 'var(--text-muted)'};"><i class="fa-solid fa-brain" style="color: ${localProfile.cotEnabled ? '#a855f7' : ''};"></i> 推理（CoT）</span> <span style="font-size: 0.6rem; font-weight: bold; color: ${localProfile.cotEnabled ? '#10b981' : '#ef4444'};">${localProfile.cotEnabled ? '开' : '关'}</span></button>`);
    sidebar.append(btnCot);

    layout.append(sidebar);

    // --- BUILD MAIN CONTENT SECTIONS ---
    const secOfficial = $(`<div class="ws-section" id="sec-official"></div>`);
    const secCustom = $(`<div class="ws-section" id="sec-custom" style="display:none;"></div>`);
    const secCot = $(`<div class="ws-section" id="sec-cot" style="display:none;"></div>`);
    const secConfig = buildStoryConfigSection().hide();

    // ==========================================
    // ── A. OFFICIAL ENGINES ──
    // ==========================================
    secOfficial.append(`<h3 style="margin-top: 0; color: var(--gold); font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;"><i class="fa-solid fa-server"></i> Megumin 官方引擎</h3>`);
    secOfficial.append(`
        <div class="mtab-callout gold" style="margin-bottom: 20px;">
            <i class="fa-solid fa-lightbulb"></i>
            <span><strong>使用提示：</strong>引擎定义了故事的“物理法则”与节奏。推理则是 AI 的内部草稿纸。为获得最佳体验，请将 V9 Mirage 引擎与 CoT V9 Mirage 搭配使用。</span>
        </div>
    `);

    const filterBar = $(`
        <div class="wstyle-filters" style="margin-bottom: 20px;">
            <button class="wstyle-filter-pill ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">全部 <span class="pill-count">${totalCount}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V4' ? 'active' : ''}" data-filter="V4">V4 <span class="pill-count">${v4Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V5' ? 'active' : ''}" data-filter="V5">V5 <span class="pill-count">${v5Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V6' ? 'active' : ''}" data-filter="V6"><i class="fa-solid fa-lock" style="font-size:0.6rem;"></i> V6 <span class="pill-count">${v6Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V7' ? 'active' : ''}" data-filter="V7">V7 <span class="pill-count">${v7Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V8' ? 'active' : ''}" data-filter="V8">V8 <span class="pill-count">${v8Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V9' ? 'active' : ''}" data-filter="V9">V9 <span class="pill-count">${v9Count}</span></button>
            <button class="wstyle-filter-pill ${activeFilter === 'V10' ? 'active' : ''}" data-filter="V10">V10 <span class="pill-count">${v10Count}</span></button>
        </div>
    `);
    secOfficial.append(filterBar);

    const coreGrid = $(`<div class="mtab-card-grid" style="margin-bottom: 20px;"></div>`);
    const v6Empty = $(`<div id="v6-empty-msg" style="display:none;"><div class="mtab-locked-state"><i class="fa-solid fa-hammer" style="color: var(--border-color);"></i><h3>V6 引擎正在锻造中。</h3><p>敬请期待下次更新！本周晚些时候。</p></div></div>`);

    hardcodedLogic.modes.forEach(m => {
        let version = "all";
        if (m.label.includes("V4")) version = "V4";
        else if (m.label.includes("V5")) version = "V5";
        else if (m.id.includes("v6")) version = "V6";
        else if (m.id.includes("v7")) version = "V7";
        else if (m.id.includes("v8")) version = "V8";
        // Before the v9 test purely so the two lists stay in the same order.
        else if (m.id.includes("v10")) version = "V10";
        else if (m.id.includes("v9")) version = "V9";

        const isLocked = m.locked === true;
        const isSel = localProfile.mode === m.id;

        let badges = '';
        if (m.recommended) badges += `<span class="ecard-badge rec"><i class="fa-solid fa-star"></i> 推荐</span>`;
        if (m.isNew && !isLocked) badges += `<span class="ecard-badge new">新</span>`;
        if (isLocked) badges += `<span class="ecard-badge locked"><i class="fa-solid fa-lock"></i> 即将推出</span>`;

        const card = $(`
            <div class="mtab-eng-card ${isSel ? 'active' : ''} ${isLocked ? 'locked-card' : ''}" data-version="${version}" style="${(activeFilter !== 'all' && activeFilter !== version) ? 'display:none;' : ''}">
                <div class="ecard-accent"></div>
                <div class="ecard-body">
                    <div class="ecard-title">
                        <span>${m.label}</span>
                        ${isSel ? `<span class="ecard-badge" style="background:rgba(16,185,129,0.15);color:#10b981;"><i class="fa-solid fa-check"></i> 使用中</span>` : ''}
                    </div>
                    <p class="ecard-desc">${descriptions[m.id] || ""}</p>
                    ${badges ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${badges}</div>` : ''}
                    ${enhancedDialogueMarkup(m, isLocked)}
                </div>
            </div>
        `);

        wireEnhancedDialogue(card, m, () => renderCoreAndCot(c));

        if (!isLocked) {
            card.on("click", () => {
                localProfile.mode = m.id;

                // Same mapping the Writing Style tab uses when it finds a locked
                // engine with no style set. One list, so the two cannot disagree.
                const lockedStyle = lockedStyleIdFor(m);
                if (lockedStyle) {
                    localProfile.activeStyleId = lockedStyle;
                    const ds = hardcodedLogic.directStyles.find(x => x.id === lockedStyle);
                    if (ds) localProfile.aiRule = ds.rule;
                }

                const currentLang = (localProfile.model && localProfile.model.includes("-")) ? localProfile.model.split('-').pop() : "english";
                // The engine→CoT mapping lives in data/cot/index.js now, so Dev
                // Mode can fill a clone's reasoning script from the same source.
                const targetCot = meguminCotForMode(m.id, currentLang);
                if (targetCot) localProfile.model = targetCot;
                saveProfileToMemory();
                renderCoreAndCot(c);
            });
        }
        coreGrid.append(card);
    });

    secOfficial.append(coreGrid);
    secOfficial.append(v6Empty);
    if (activeFilter === "V6") v6Empty.show();

    filterBar.find('.wstyle-filter-pill').on('click', function () {
        filterBar.find('.wstyle-filter-pill').removeClass('active');
        $(this).addClass('active');
        const filter = $(this).attr('data-filter');
        if (filter === "all") {
            coreGrid.find('.mtab-eng-card').show(); v6Empty.hide();
        } else {
            coreGrid.find('.mtab-eng-card').each(function () {
                if ($(this).attr('data-version') === filter) $(this).show(); else $(this).hide();
            });
            if (filter === "V6") v6Empty.show(); else v6Empty.hide();
        }
    });

    const activeEngineForToggles = [...hardcodedLogic.modes, ...(extension_settings[extensionName].customModes || [])].find(m => m.id === localProfile.mode);
    const isV7ForToggles = isV7Engine(activeEngineForToggles);
    if (isV7ForToggles) {
        secOfficial.append(`<div class="wstyle-section-head blue" style="margin-top: 15px;"><i class="fa-solid fa-layer-group"></i> V7 模块（关闭以禁用）</div>`);
        const v7ToggleList = $(`<div class="mtab-card-list"></div>`);
        const v7Toggles = [
            { id: "v7_ooc", label: "OOC 协议", desc: "允许角色外指令。" },
            { id: "v7_pcsolo", label: "PC 独处描写", desc: "未被观察时对 PC 的旁白。" },
            { id: "v7_intro", label: "登场协议", desc: "新 NPC 如何进入故事。" },
            { id: "v7_culture", label: "文化锚定", desc: "现实世界的整合与引用。" },
            { id: "v7_scene", label: "场景调度", desc: "焦点切换与人群管理。" }
        ];

        v7Toggles.forEach(tog => {
            if (localProfile.toggles[tog.id] === undefined) localProfile.toggles[tog.id] = true;
            const isOn = localProfile.toggles[tog.id];

            const tCard = $(`
                <div class="mtab-toggle-row ${isOn ? 'active' : ''}" style="cursor: pointer;">
                    <div class="toggle-info">
                        <div class="toggle-label">${tog.label}</div>
                        <div class="toggle-desc">${tog.desc}</div>
                    </div>
                    <div class="ps-switch"></div>
                </div>
            `);
            tCard.on("click", () => { localProfile.toggles[tog.id] = !localProfile.toggles[tog.id]; saveProfileToMemory(); renderCoreAndCot(c); });
            v7ToggleList.append(tCard);
        });
        secOfficial.append(v7ToggleList);
    }

    // ==========================================
    // ── B. CUSTOM ENGINES ──
    // ==========================================
    secCustom.append(`<h3 style="margin-top: 0; color: #10b981; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;"><i class="fa-solid fa-microchip"></i> 你的自定义引擎</h3>`);
    const customModes = extension_settings[extensionName].customModes || [];

    if (customModes.length === 0) {
        secCustom.append(`<div style="padding: 30px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 14px;">还没有自定义引擎。前往开发模式创建或导入一个吧！</div>`);
    } else {
        const customGrid = $(`<div class="mtab-card-grid"></div>`);
        customModes.forEach(m => {
            const isSel = localProfile.mode === m.id;
            const card = $(`
                <div class="mtab-eng-card ${isSel ? 'active' : ''}">
                    <div class="ecard-accent"></div>
                    <div class="ecard-body">
                        <div class="ecard-title">
                            <span>${m.label}</span>
                            <button class="ps-modern-btn secondary btn-quick-edit" style="padding:4px 10px;font-size:0.7rem;color:var(--gold);border-color:rgba(245,158,11,0.3);background:transparent;">
                                <i class="fa-solid fa-pen"></i> 编辑
                            </button>
                        </div>
                        <p class="ecard-desc">自定义引擎流程</p>
                        ${enhancedDialogueMarkup(m, false)}
                    </div>
                </div>
            `);
            card.on("click", (e) => {
                if ($(e.target).closest('.btn-quick-edit').length) return;
                if ($(e.target).closest('.ecard-opt').length) return;
                localProfile.mode = m.id; saveProfileToMemory(); renderCoreAndCot(c);
            });
            wireEnhancedDialogue(card, m, () => renderCoreAndCot(c));
            card.find(".btn-quick-edit").on("click", () => renderDevMode("editor", m.id, null, "tab"));
            customGrid.append(card);
        });
        secCustom.append(customGrid);
    }

    // ==========================================
    // ── C. CHAIN OF THOUGHT (REASONING) ──
    // ==========================================
    secCot.append(`<h3 style="margin-top: 0; color: #a855f7; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;"><i class="fa-solid fa-brain"></i> 思维链（推理）</h3>`);

    if (localProfile.cotEnabled === undefined) localProfile.cotEnabled = true;

    const cotToggle = $(`
        <div class="mtab-toggle-row ${localProfile.cotEnabled ? 'active' : ''}" style="margin-bottom: 20px; border-color: ${localProfile.cotEnabled ? '#a855f7' : 'var(--border-color)'}; cursor: pointer;">
            <div class="toggle-info">
                <div class="toggle-label" style="color: ${localProfile.cotEnabled ? '#a855f7' : 'var(--text-main)'};"><i class="fa-solid fa-power-off"></i> 启用思维链</div>
                <div class="toggle-desc">切换整个 AI 推理系统。关闭时 AI 直接生成回复。</div>
            </div>
            <div class="ps-switch" style="${localProfile.cotEnabled ? 'background:#a855f7;' : ''}"></div>
        </div>
    `);
    cotToggle.on("click", function() {
        localProfile.cotEnabled = !localProfile.cotEnabled;
        saveProfileToMemory();
        renderCoreAndCot(c);
    });
    secCot.append(cotToggle);

    if (localProfile.cotEnabled) {
        if (activeEng && activeEng.cot && activeEng.cot.trim() !== "") {
            secCot.append(`
                <div class="mtab-callout green" style="margin-bottom:20px;">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span><strong>自定义引擎逻辑已激活</strong>——该引擎自带 [[COT]] 与 [[prefill]]。以下选择将被引擎代码覆盖。</span>
                </div>
            `);
        }

        const migrationMap = {
            "cot-english": "cot-v1-english", "cot-arabic": "cot-v1-arabic", "cot-spanish": "cot-v1-spanish", "cot-french": "cot-v1-french",
            "cot-zh": "cot-v1-zh", "cot-ru": "cot-v1-ru", "cot-jp": "cot-v1-jp", "cot-pt": "cot-v1-pt", "cot-english-test": "cot-v2-english"
        };
        if (migrationMap[localProfile.model]) { localProfile.model = migrationMap[localProfile.model]; saveProfileToMemory(); }

        if (localProfile.model === "cot-off") {
            localProfile.cotEnabled = false;
            localProfile.model = "cot-v7.5-english";
            saveProfileToMemory();
        }

        let currentType = "off", currentLang = "english";
        // The two specific V10 sets are tested before the general one, exactly as
        // v9-lite and v9-director are below: "cot-v10-shura-english" starts with
        // "cot-v10-" too, so a bare test would swallow it.
        // Longest prefix first: "cot-v10-shura-cap-" also starts with
        // "cot-v10-shura-", so the capped ids have to be tested ahead of the plain
        // ones or every cap reads back as its uncapped sibling.
        if (localProfile.model && localProfile.model.startsWith("cot-v10-ukiyo-cap-")) { currentType = "v10-ukiyo-cap"; currentLang = "english"; }
        else if (localProfile.model && localProfile.model.startsWith("cot-v10-shura-cap-")) { currentType = "v10-shura-cap"; currentLang = "english"; }
        else if (localProfile.model && localProfile.model.startsWith("cot-v10-ukiyo-")) { currentType = "v10-ukiyo"; currentLang = "english"; }
        else if (localProfile.model && localProfile.model.startsWith("cot-v10-shura-")) { currentType = "v10-shura"; currentLang = "english"; }
        else if (localProfile.model && localProfile.model.startsWith("cot-v1-")) { currentType = "v1"; currentLang = localProfile.model.replace("cot-v1-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v2-")) { currentType = "v2"; currentLang = localProfile.model.replace("cot-v2-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v6-lite-")) { currentType = "v6-lite"; currentLang = localProfile.model.replace("cot-v6-lite-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v6-")) { currentType = "v6"; currentLang = localProfile.model.replace("cot-v6-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v7.5-")) { currentType = "v7.5"; currentLang = localProfile.model.replace("cot-v7.5-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v7-lite-")) { currentType = "v7-lite"; currentLang = localProfile.model.replace("cot-v7-lite-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v7-")) { currentType = "v7"; currentLang = localProfile.model.replace("cot-v7-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v8-fusion-")) { currentType = "v8-fusion"; currentLang = localProfile.model.replace("cot-v8-fusion-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v8-")) { currentType = "v8"; currentLang = localProfile.model.replace("cot-v8-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v9-lite-")) { currentType = "v9-lite"; currentLang = localProfile.model.replace("cot-v9-lite-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v9-director-")) { currentType = "v9-director"; currentLang = localProfile.model.replace("cot-v9-director-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v9-immersion-")) { currentType = "v9-immersion"; currentLang = localProfile.model.replace("cot-v9-immersion-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v9-hybrid-")) { currentType = "v9-hybrid"; currentLang = localProfile.model.replace("cot-v9-hybrid-", ""); }
        else if (localProfile.model && localProfile.model.startsWith("cot-v9-")) { currentType = "v9"; currentLang = localProfile.model.replace("cot-v9-", ""); }

        let allowedCotTypes = null; 
        if (localProfile.mode.includes("v10")) allowedCotTypes = ["v10-ukiyo", "v10-ukiyo-cap", "v10-shura", "v10-shura-cap"];
        else if (localProfile.mode.includes("v6")) allowedCotTypes = ["v6", "v6-lite"];
        else if (localProfile.mode === "v7.5") allowedCotTypes = ["v7.5"];
        else if (localProfile.mode.includes("v7")) allowedCotTypes = ["v7", "v7-lite"];
        else if (localProfile.mode === "v8-fusion") allowedCotTypes = ["v8-fusion"]; 
        else if (localProfile.mode.includes("v8")) allowedCotTypes = ["v8"]; 
        else if (localProfile.mode.includes("v9")) allowedCotTypes = ["v9", "v9-lite", "v9-director", "v9-immersion", "v9-hybrid"];

        // Thinking Frameworks
        secCot.append(`<div class="wstyle-section-head purple"><i class="fa-solid fa-diagram-project"></i> 选择框架</div>`);
        const typeGrid = $(`<div class="mtab-card-grid" style="margin-bottom: 24px;"></div>`);
        const types = [
            { id: "v10-ukiyo", label: "CoT V10 Ukiyo", desc: "为 Ukiyo 打造的长篇推理。像小说家在动笔前喃喃自语——现在时、略显凌乱、从不制定计划。没有阶段、没有清单、没有检查。", isNew: true },
            { id: "v10-ukiyo-cap", label: "CoT V10 Ukiyo — 思考上限", desc: "同一个作者的心智，但为思考阶段设了硬性上限。适合想太多的模型。", isNew: true },
            { id: "v10-shura", label: "CoT V10 Shura", desc: "七条规则直接带进写作，而非动笔前先做计划。为 V10 Shura 打造，四个中最轻量。", isNew: true },
            { id: "v10-shura-cap", label: "CoT V10 Shura — 思考上限", desc: "同样的七条规则，但为思考阶段设了硬性上限。适合想太多的模型。", isNew: true },
            { id: "v1", label: "CoT V1（经典）", desc: "最初的 8 步框架。高度聚焦 NPC 的内部情感图景与其可观察行为之间的对比。" },
            { id: "v2", label: "CoT V2（新版）", desc: "新的实验性框架。更严格的事实核查、信息审计、更好的 NPC，以及钩子生成。" },
            { id: "v6", label: "CoT V6（梦之队）", desc: "专为 V6 引擎设计的完整 4 阶段流程。专业化的验证与建模。" },
            { id: "v6-lite", label: "CoT V6（精简版）", desc: "精简的 3 阶段流程。在保持叙事规则的同时降低 token 开销。" },
            { id: "v7", label: "CoT V7", desc: "全新的 V7 流程，采用 5 阶段严格事实重建。"},
            { id: "v7-lite", label: "CoT V7（精简版）", desc: "为 V7 精简的 5 阶段流程。" },
            { id: "v7.5", label: "CoT V7.5 Kismet", desc: "全新的 V7.5 流程，聚焦故事引擎机制。" },
            { id: "v8", label: "CoT V8", desc: "全新的 V8 叙事处理流程。" },
            { id: "v8-fusion", label: "CoT V8 Fusion", desc: "全新的 V8 Fusion 叙事处理流程。" },
            { id: "v9", label: "CoT V9 Mirage", desc: "最主流且最均衡的推理流程，专为 V9 Mirage 引擎打造。现代角色扮演的金标准。", isNew: true },
            { id: "v9-director", label: "CoT V9 Mirage Air", desc: "CoT V9 Mirage 的轻量版本，会给出不同的输出，试试看喜不喜欢。", isNew: true },
            { id: "v9-immersion", label: "CoT V9 Mirage Max", desc: "重负载、最大化思考的流程。迫使 AI 在生成第一个字之前，深入感官数据与心理真实感。", isNew: true },
            { id: "v9-hybrid", label: "CoT V9 Kuromaku", desc: "专门设计用于搭配 V9 Kuromaku 引擎的多智能体推理流程。", isNew: true },
            { id: "v9-lite", label: "CoT V9 Cui（精简版）", desc: "高度精简、快速执行的推理流程，与 V9 Cui 引擎完美搭配以节省 token。", isNew: true }
        ];
        types.forEach(t => {
            const isSel = currentType === t.id;
            const isWarned = allowedCotTypes !== null && !allowedCotTypes.includes(t.id);
            
            let badges = '';
            if (isWarned) badges = `<span class="ecard-badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;"><i class="fa-solid fa-triangle-exclamation"></i> 可能不兼容</span>`;
            else if (t.isNew) badges = `<span class="ecard-badge new">新</span>`;

            const card = $(`
                <div class="mtab-eng-card ${isSel ? 'active' : ''}">
                    <div class="ecard-accent"></div>
                    <div class="ecard-body">
                        <div class="ecard-title">
                            <span>${t.label}</span>
                            ${isSel ? `<span class="ecard-badge" style="background:rgba(168,85,247,0.15);color:#a855f7;"><i class="fa-solid fa-check"></i> 使用中</span>` : ''}
                        </div>
                        <p class="ecard-desc">${t.desc}</p>
                        ${badges ? `<div style="margin-top:4px;">${badges}</div>` : ''}
                    </div>
                </div>
            `);
            
            card.on("click", () => {
                if (t.id.startsWith("v10")) localProfile.model = `cot-${t.id}-english`;
                else if (t.id === "v7") localProfile.model = `cot-v7-english`;
                else if (t.id === "v7.5") localProfile.model = `cot-v7.5-english`;
                else if (t.id === "v7-lite") localProfile.model = `cot-v7-lite-english`;
                else if (t.id === "v8") localProfile.model = `cot-v8-english`;
                else if (t.id === "v8-fusion") localProfile.model = `cot-v8-fusion-english`;
                else if (t.id.startsWith("v9")) localProfile.model = `cot-${t.id}-english`;
                else localProfile.model = `cot-${t.id}-${currentLang}`;
                saveProfileToMemory(); renderCoreAndCot(c);
            }); 
            typeGrid.append(card);
        });
        secCot.append(typeGrid);

        // Thinking Effort
        if (!localProfile.thinkEffort) localProfile.thinkEffort = "unspecified";
        if (!localProfile.customThinkEffort) localProfile.customThinkEffort = "100";

        secCot.append(`<div class="wstyle-section-head purple"><i class="fa-solid fa-gauge-high"></i> 思考强度</div>`);
        const effortGrid = $(`<div class="mtab-card-grid" style="margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));"></div>`);
        const efforts = [
            { id: "100", label: "100 词" },
            { id: "250", label: "250 词" },
            { id: "450", label: "450 词" },
            { id: "custom", label: "自定义" },
            { id: "unspecified", label: "未指定" }
        ];
        efforts.forEach(e => {
            const isSel = localProfile.thinkEffort === e.id;
            const card = $(`
                <div class="mtab-eng-card ${isSel ? 'active' : ''}" style="text-align:center;">
                    <div class="ecard-accent"></div>
                    <div class="ecard-body" style="padding:12px 10px; align-items:center;">
                        <span style="font-weight:700; font-size:0.85rem; color:${isSel ? '#a855f7' : 'var(--text-main)'};">${e.label}</span>
                    </div>
                </div>
            `);
            card.on("click", () => { localProfile.thinkEffort = e.id; saveProfileToMemory(); renderCoreAndCot(c); });
            effortGrid.append(card);
        });
        secCot.append(effortGrid);

        if (localProfile.thinkEffort === "custom") {
            const customBlock = $(`
                <div class="mtab-panel" style="margin-top:-14px; margin-bottom:24px;">
                    <div class="mtab-setting-row">
                        <div class="set-info"><div class="set-label">自定义词数</div></div>
                        <input type="number" id="ps_input_custom_effort" class="ps-modern-input" style="width: 150px;" value="${localProfile.customThinkEffort}" min="1" />
                    </div>
                </div>
            `);
            customBlock.find("#ps_input_custom_effort").on("change input", function () {
                localProfile.customThinkEffort = $(this).val(); saveProfileToMemory();
            });
            secCot.append(customBlock);
        }

        // Gemini Toggle
        if (localProfile.thinkingV2 === undefined) localProfile.thinkingV2 = false;
        const v2Card = $(`
            <div class="mtab-toggle-row ${localProfile.thinkingV2 ? 'active' : ''}" style="margin-bottom: 24px; cursor: pointer;">
                <div class="toggle-info">
                    <div class="toggle-label"><i class="fa-solid fa-sparkles" style="color:#a855f7;"></i> Gemini 思考覆盖</div>
                    <div class="toggle-desc">仅对 Gemini 模型启用，用于注入特定 XML 标签。</div>
                </div>
                <div class="ps-switch"></div>
            </div>
        `);
        v2Card.on("click", function () { localProfile.thinkingV2 = !localProfile.thinkingV2; saveProfileToMemory(); renderCoreAndCot(c); });
        secCot.append(v2Card);

        // Language
        secCot.append(`<div class="wstyle-section-head gold"><i class="fa-solid fa-language"></i> 推理语言</div>`);
        const langGrid = $(`<div class="mtab-card-grid" style="margin-bottom: 20px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));"></div>`);
        let langs = [
            { id: "english", label: "英语" }, { id: "arabic", label: "阿拉伯语（العربية）", rec: true }, { id: "spanish", label: "西班牙语（Español）" },
            { id: "french", label: "法语（Français）" }, { id: "zh", label: "中文（简体）" }, { id: "ru", label: "俄语（Русский）" },
            { id: "jp", label: "日语（日本語）" }, { id: "pt", label: "葡萄牙语（Português）" }
        ];
        if (currentType.startsWith("v10") || currentType === "v7" || currentType === "v7-lite" || currentType === "v7.5" || currentType === "v8" || currentType === "v8-fusion" || currentType.startsWith("v9")) langs = [{ id: "english", label: "英语" }];
        langs.forEach(l => {
            const isSel = currentLang === l.id;
            let badges = '';
            if (l.rec) badges = `<span class="ecard-badge rec"><i class="fa-solid fa-star"></i> 使用提示</span>`;

            const card = $(`
                <div class="mtab-eng-card ${isSel ? 'active' : ''}">
                    <div class="ecard-accent"></div>
                    <div class="ecard-body" style="padding:12px 16px;">
                        <div class="ecard-title" style="font-size:0.88rem;">
                            <span>${l.label}</span>
                            ${isSel ? `<span class="ecard-badge" style="background:rgba(245,158,11,0.15);color:var(--gold);"><i class="fa-solid fa-check"></i></span>` : ''}
                        </div>
                        ${badges ? `<div style="margin-top:2px;">${badges}</div>` : ''}
                    </div>
                </div>
            `);
            card.on("click", () => { localProfile.model = `cot-${currentType}-${l.id}`; saveProfileToMemory(); renderCoreAndCot(c); });
            langGrid.append(card);
        }); 
        secCot.append(langGrid);
    }

    // --- ASSEMBLE ---
    mainArea.append(secOfficial).append(secCustom).append(secCot).append(secConfig);
    layout.append(mainArea);
    root.append(layout);
    c.append(root);

    // ── NAVIGATION LOGIC ──
    const navButtons = [btnOfficial, btnCustom, btnCot, btnConfig];
    const sections = [secOfficial, secCustom, secCot, secConfig];

    const switchSection = (targetId) => {
        navButtons.forEach(btn => {
            if (btn.attr('data-target') === targetId) btn.addClass('active');
            else btn.removeClass('active');
        });
        sections.forEach(sec => {
            if (sec.attr('id') === targetId) sec.show();
            else sec.hide();
        });
    };

    btnOfficial.on('click', () => switchSection('sec-official'));
    btnCustom.on('click', () => switchSection('sec-custom'));
    btnCot.on('click', () => switchSection('sec-cot'));
    btnConfig.on('click', () => switchSection('sec-config'));

    // Trigger initial state
    switchSection(activeSubTab);
}
