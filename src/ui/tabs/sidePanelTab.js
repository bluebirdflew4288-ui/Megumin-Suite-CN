// ────────────────────────────────────────────────────────────────────────────
// Side Panel — popping tracker blocks out of the chat.
// ────────────────────────────────────────────────────────────────────────────

import { localProfile } from "../../core/state.js";
import { extension_settings, saveSettingsDebounced } from "../../st.js";
import { meguminScheduleBlocksRefresh } from "../../features/blocks/chat.js";
import { saveProfileToMemory, saveProfileDebounced } from "../../core/profile.js";
import {
    getSidePanelSettings, applyInlineHidingChange, applyPositionChange, applyWidthChange,
    applyEnabledChange, applyModeChange, applyScaleChange, applySectionOrder,
    resetSectionLayout, getOrderedSections, getPresentBarSettings, applyPresentBarChange,
    refreshSidePanel, refreshPresentBar,
} from "../../sidepanel/panel.js";
import { SECTION_REGISTRY } from "../../sidepanel/sections.js";

export function renderSidePanelTab(c) {
    c.empty();
    const cfg = getSidePanelSettings();
    const pb = getPresentBarSettings();

    const enabledBadge = `<div id="megsp_header_badge" class="mtab-header-badge" style="background: ${cfg.enabled ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)'}; color: ${cfg.enabled ? '#f59e0b' : 'var(--text-muted)'}; border: 1px solid ${cfg.enabled ? 'rgba(245,158,11,0.25)' : 'var(--border-color)'};">
        <i class="fa-solid fa-${cfg.enabled ? 'circle-check' : 'circle-xmark'}" style="font-size:0.6rem;"></i> ${cfg.enabled ? '已启用' : '已禁用'}
    </div>`;

    const isDocked = cfg.mode !== "floating";
    const sectionRows = getOrderedSections(cfg).map((def, i) => `
        <div class="mtab-toggle-row meg-sp-section-toggle ${cfg.sections[def.id]?.visible !== false ? 'active' : ''}" data-section="${def.id}">
            <div class="toggle-info">
                <div class="toggle-label"><span class="meg-sp-order-num">${i + 1}</span><i class="fa-solid ${def.icon}" style="color: var(--gold);"></i> ${def.title}</div>
            </div>
            <div class="ps-switch"></div>
        </div>
    `).join("");

    c.append(`
        <div class="mtab-header">
            <div class="mtab-header-left">
                <div class="mtab-header-icon" style="background: linear-gradient(135deg, #f59e0b, #b45309);">
                     <i class="fa-solid fa-table-columns"></i>
                </div>
                <div>
                    <h2>侧边面板</h2>
                    <p>可停靠 / 可浮动的追踪面板。浮动时拖拽标题栏移动、从边缘调整大小、为区块排序。AI 回复时自动更新。</p>
                </div>
            </div>
            ${enabledBadge}
        </div>

        <div class="mtab-callout red" style="margin-bottom: 16px;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span><strong>已停止开发。</strong>信息块做得更好——更漂亮的卡片、远多的
            可改项，并且能跟上不断上线的新信息块。坦率地说，
            Kazuma 不喜欢侧边面板。
            <br><br>因此它已不再开发、也未跟上进度：新信息块、自定义
            信息块与状态块可能不会出现在其中，或显示错误。它仍能处理
            它原本认识的内容，而且它显示的一切都会画进聊天卡片，
            无论如何。</span>
        </div>

        <div class="mtab-toggle-row ${cfg.enabled ? 'active' : ''}" id="megsp_enabled_row" style="margin-bottom: 20px;">
            <div class="toggle-info">
                <div class="toggle-label"><i class="fa-solid fa-table-columns" style="color:var(--gold);"></i> 启用侧边面板</div>
                <div class="toggle-desc">将面板挂载到页面上。关闭时，追踪器照常保持在聊天气泡内。</div>
            </div>
            <div class="ps-switch"></div>
        </div>

        <div id="megsp_main_content" style="display: ${cfg.enabled ? 'block' : 'none'};">
            <div class="meg-sp-group-head"><i class="fa-solid fa-window-maximize"></i> Panel</div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">模式</div>
                    <div class="desc">停靠将面板固定到屏幕边缘；浮动则将其变为可拖拽、可调整大小的窗口。</div>
                </div>
                <div class="control">
                    <select id="megsp_mode" class="ps-modern-input" style="min-width: 140px;">
                        <option value="docked" ${isDocked ? "selected" : ""}>停靠</option>
                        <option value="floating" ${!isDocked ? "selected" : ""}>浮动</option>
                    </select>
                </div>
            </div>

            <div class="meg-sp-settings-row" id="megsp_position_row" style="${isDocked ? "" : "display:none;"}">
                <div>
                    <div class="label">停靠边缘</div>
                    <div class="desc">面板锚定到屏幕的哪条边缘。</div>
                </div>
                <div class="control">
                    <select id="megsp_position" class="ps-modern-input" style="min-width: 140px;">
                        <option value="right" ${cfg.position === "right" ? "selected" : ""}>右侧</option>
                        <option value="left" ${cfg.position === "left" ? "selected" : ""}>左侧</option>
                    </select>
                </div>
            </div>

            <div class="meg-sp-settings-row" id="megsp_width_row" style="${isDocked ? "" : "display:none;"}">
                <div>
                    <div class="label">停靠宽度</div>
                    <div class="desc">你也可以拖拽面板内缘调整大小。移动端限制为视口的 94%。</div>
                </div>
                <div class="control">
                    <input id="megsp_width" type="number" min="320" max="1100" step="10" value="${cfg.width || 620}" class="ps-modern-input" style="width: 110px;" />
                    <span style="color: var(--text-muted); font-size: 12px;">px</span>
                </div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">界面缩放</div>
                    <div class="desc">缩放整个面板——文本、卡片、头像，一切。</div>
                </div>
                <div class="control">
                    <input id="megsp_scale" type="range" min="0.8" max="1.4" step="0.05" value="${cfg.scale || 1}" style="width: 140px;" />
                    <span id="megsp_scale_val" style="color: var(--text-muted); font-size: 12px; min-width: 42px; text-align: right;">${Math.round((cfg.scale || 1) * 100)}%</span>
                </div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">重置浮动位置</div>
                    <div class="desc">把丢失的浮动面板恢复到默认位置与大小。</div>
                </div>
                <div class="control"><button id="megsp_float_reset" class="ps-modern-btn secondary"><i class="fa-solid fa-crosshairs"></i> 重置</button></div>
            </div>

            <div class="meg-sp-group-head"><i class="fa-solid fa-layer-group"></i> Sections</div>

            <div class="meg-sp-settings-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
                <div>
                    <div class="label">要显示的区块</div>
                    <div class="desc">切换可见性。数字显示当前面板顺序——在面板中按住 Alt+↑/↓ 拖动区块手柄可重新排序。</div>
                </div>
                <div class="meg-sp-section-grid">
                    ${sectionRows}
                </div>
            </div>

            <div class="mtab-toggle-row ${cfg.autoHideEmpty ? 'active' : ''}" id="megsp_autohide_row">
                <div class="toggle-info">
                    <div class="toggle-label">隐藏无数据的区块</div>
                    <div class="toggle-desc">没有任何内容的区块会消失，而非渲染一个空壳。</div>
                </div>
                <div class="ps-switch"></div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">重置区块布局</div>
                    <div class="desc">恢复默认顺序、可见性与展开/折叠状态。</div>
                </div>
                <div class="control"><button id="megsp_sections_reset" class="ps-modern-btn secondary"><i class="fa-solid fa-rotate-left"></i> 重置</button></div>
            </div>

            <div class="meg-sp-group-head"><i class="fa-solid fa-users"></i> Present Characters Bar</div>

            <div class="mtab-toggle-row ${pb.enabled ? 'active' : ''}" id="megpb_enabled_row">
                <div class="toggle-info">
                    <div class="toggle-label">启用在场角色栏</div>
                    <div class="toggle-desc">聊天输入框旁的毁灭战士风格横向头像条。从 AI 世界状态的“在场 NPC”拉取阵容，从 NPC 库拉取头像。</div>
                </div>
                <div class="ps-switch"></div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">栏位置</div>
                    <div class="desc">该条带相对 SillyTavern 消息输入框的挂载位置。</div>
                </div>
                <div class="control">
                    <select id="megpb_position" class="ps-modern-input" style="min-width: 160px;">
                        <option value="above" ${pb.position === "above" ? "selected" : ""}>输入框上方</option>
                        <option value="below" ${pb.position === "below" ? "selected" : ""}>输入框下方</option>
                        <option value="off"   ${pb.position === "off"   ? "selected" : ""}>关闭（隐藏）</option>
                    </select>
                </div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">卡片尺寸</div>
                    <div class="desc">条带中每张头像卡的宽 × 高。</div>
                </div>
                <div class="control">
                    <input id="megpb_card_w" type="number" min="80" max="240" step="5" value="${pb.cardWidth || 120}" class="ps-modern-input" style="width: 80px;" />
                    <span style="color: var(--text-muted); font-size: 12px;">×</span>
                    <input id="megpb_card_h" type="number" min="100" max="320" step="5" value="${pb.cardHeight || 160}" class="ps-modern-input" style="width: 80px;" />
                    <span style="color: var(--text-muted); font-size: 12px;">px</span>
                </div>
            </div>

            <div class="meg-sp-group-head"><i class="fa-solid fa-screwdriver-wrench"></i> 高级</div>

            <div class="mtab-toggle-row ${cfg.hideInline ? 'active' : ''}" id="megsp_hideinline_row">
                <div class="toggle-info">
                    <div class="toggle-label">隐藏聊天中的行内追踪信息块</div>
                    <div class="toggle-desc">从渲染出的聊天 DOM 中移除 <code>&lt;details&gt;</code> 追踪信息块（它们仍保留在已保存消息中，因此重新解析仍可工作）。</div>
                </div>
                <div class="ps-switch"></div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">强制刷新</div>
                    <div class="desc">立即重新解析最新一条助手消息并重建面板。</div>
                </div>
                <div class="control"><button id="megsp_refresh" class="ps-modern-btn primary"><i class="fa-solid fa-rotate"></i> 刷新</button></div>
            </div>

            <div class="meg-sp-settings-row">
                <div>
                    <div class="label">重置全部侧边面板设置</div>
                    <div class="desc">将此标签页上的所有设置擦除并恢复默认值。调试控制台句柄：<code>window.LukaSuite</code></div>
                </div>
                <div class="control"><button id="megsp_reset_all" class="ps-modern-btn secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fa-solid fa-trash"></i> 全部重置</button></div>
            </div>
        </div>
    `);

    // ── Panel group ──
    c.find("#megsp_enabled_row").on("click", function () {
        cfg.enabled = !cfg.enabled;
        saveSettingsDebounced();
        applyEnabledChange();
        refreshSidePanel();
        meguminScheduleBlocksRefresh();
        if (cfg.enabled) {
            $(this).addClass("active");
            $("#megsp_main_content").slideDown(200);
            $("#megsp_header_badge").css({ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', 'border-color': 'rgba(245,158,11,0.25)' }).html(`<i class="fa-solid fa-circle-check" style="font-size:0.6rem;"></i> 已启用`);
        } else {
            $(this).removeClass("active");
            $("#megsp_main_content").slideUp(200);
            $("#megsp_header_badge").css({ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', 'border-color': 'var(--border-color)' }).html(`<i class="fa-solid fa-circle-xmark" style="font-size:0.6rem;"></i> 已禁用`);
        }
    });
    c.find("#megsp_mode").on("change", function () {
        cfg.mode = $(this).val();
        saveSettingsDebounced();
        applyModeChange();
        refreshSidePanel();
        const docked = cfg.mode === "docked";
        $("#megsp_position_row, #megsp_width_row").toggle(docked);
    });
    c.find("#megsp_position").on("change", function () {
        cfg.position = $(this).val();
        saveSettingsDebounced();
        applyPositionChange();
    });
    c.find("#megsp_width").on("input change", function () {
        const v = Math.max(320, Math.min(1100, parseInt($(this).val(), 10) || 620));
        cfg.width = v;
        saveSettingsDebounced();
        applyWidthChange();
    });
    c.find("#megsp_scale").on("input", function () {
        cfg.scale = parseFloat($(this).val()) || 1;
        $("#megsp_scale_val").text(Math.round(cfg.scale * 100) + "%");
        applyScaleChange();
    });
    c.find("#megsp_scale").on("change", function () {
        saveSettingsDebounced();
    });
    c.find("#megsp_float_reset").on("click", function () {
        cfg.float = { x: null, y: null, w: 620, h: 720 };
        saveSettingsDebounced();
        applyModeChange();
        toastr.success("浮动位置已重置", "Megumin Suite");
    });

    // ── Sections group ──
    c.find(".meg-sp-section-toggle").on("click", function () {
        const key = $(this).attr("data-section");
        if (!cfg.sections[key]) return;
        cfg.sections[key].visible = !cfg.sections[key].visible;
        $(this).toggleClass("active", cfg.sections[key].visible);
        saveSettingsDebounced();
        refreshSidePanel();
    });
    c.find("#megsp_autohide_row").on("click", function () {
        cfg.autoHideEmpty = !cfg.autoHideEmpty;
        $(this).toggleClass("active", cfg.autoHideEmpty);
        saveSettingsDebounced();
        refreshSidePanel();
    });
    c.find("#megsp_sections_reset").on("click", function () {
        resetSectionLayout();
        renderSidePanelTab(c);
        toastr.success("区块布局已重置", "Megumin Suite");
    });

    // ── Present Characters Bar group ──
    c.find("#megpb_enabled_row").on("click", function () {
        pb.enabled = !pb.enabled;
        $(this).toggleClass("active", pb.enabled);
        saveSettingsDebounced();
        applyPresentBarChange();
    });
    c.find("#megpb_position").on("change", function () {
        pb.position = $(this).val();
        saveSettingsDebounced();
        applyPresentBarChange();
    });
    c.find("#megpb_card_w").on("input change", function () {
        const v = Math.max(80, Math.min(240, parseInt($(this).val(), 10) || 120));
        pb.cardWidth = v;
        saveSettingsDebounced();
        applyPresentBarChange();
    });
    c.find("#megpb_card_h").on("input change", function () {
        const v = Math.max(100, Math.min(320, parseInt($(this).val(), 10) || 160));
        pb.cardHeight = v;
        saveSettingsDebounced();
        applyPresentBarChange();
    });

    // ── Advanced group ──
    c.find("#megsp_hideinline_row").on("click", function () {
        cfg.hideInline = !cfg.hideInline;
        $(this).toggleClass("active", cfg.hideInline);
        saveSettingsDebounced();
        applyInlineHidingChange();
        meguminScheduleBlocksRefresh();
    });
    c.find("#megsp_refresh").on("click", function () {
        refreshSidePanel();
        refreshPresentBar();
        toastr.success("侧边面板已刷新", "Megumin Suite");
    });
    c.find("#megsp_reset_all").on("click", function () {
        if (!confirm("重置全部侧边面板设置并恢复默认值？")) return;
        delete extension_settings["Megumin-Suite"].sidePanel;
        delete extension_settings["Megumin-Suite"].presentBar;
        saveSettingsDebounced();
        applyEnabledChange();
        applyPresentBarChange();
        refreshSidePanel();
        meguminScheduleBlocksRefresh();
        renderSidePanelTab(c);
        toastr.success("侧边面板设置已重置", "Megumin Suite");
    });
}
