#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Megumin-Suite 中文本地化 映射批 5a：data 目录显示字段（modes/toggles/personalities/addons/blocks）
约束：V4/V5/V6 前缀参与版本分类逻辑（label.includes），保留前缀；引擎专名保留。"""

MAPS = {
    # ═══════════════════════════ data/modes/legacy.js ═══════════════════════════
    "data/modes/legacy.js": [
        ('label: "V6 Dream Team"', 'label: "V6 梦之队"', "once"),
        ('label: "V6 Dream Team Lite"', 'label: "V6 梦之队精简版"', "once"),
        ('label: "V5 Slice of Reality"', 'label: "V5 现实切片"', "once"),
        ('label: "V4.2 Balance"', 'label: "V4.2 平衡"', "once"),
        ('label: "V4 Cinematic"', 'label: "V4 电影化"', "once"),
        ('label: "V4 Dark"', 'label: "V4 黑暗"', "once"),
        ('label: "Anime Director"', 'label: "动漫导演"', "once"),
    ],
    # ═══════════════════════════ data/modes/v7.js ═══════════════════════════
    "data/modes/v7.js": [
        ('label: "V7 Core"', 'label: "V7 核心"', "once"),
        ('label: "V7 Reality"', 'label: "V7 现实"', "once"),
        ('label: "V7 Gentle"', 'label: "V7 温和"', "once"),
        ('label: "V7.5 Kismet"', 'label: "V7.5 Kismet"', "once"),
    ],
    # ═══════════════════════════ data/modes/v10.js（Co-writer 后缀翻译，专名保留）═══════════════════════════
    "data/modes/v10.js": [
        ('label: "V10 Ukiyo", color: "#f43f5e"', 'label: "V10 Ukiyo", color: "#f43f5e"', "once"),
        ('"V10 Ukiyo Co-writer"', '"V10 Ukiyo 联合编剧"', "once"),
        ('"V10 Shura Co-writer"', '"V10 Shura 联合编剧"', "once"),
    ],
    # ═══════════════════════════ data/toggles.js ═══════════════════════════
    "data/toggles.js": [
        ('label: "OOC Commentary"', 'label: "OOC 评述"', "once"),
        ('label: "Stop the AI from Controling User"', 'label: "阻止 AI 控制用户"', "once"),
    ],
    # ═══════════════════════════ data/personalities.js ═══════════════════════════
    "data/personalities.js": [
        ('label: "Director"', 'label: "导演"', "once"),
        ('label: "Engine"', 'label: "引擎"', "once"),
    ],
    # ═══════════════════════════ data/addons.js ═══════════════════════════
    "data/addons.js": [
        ('label: "Dice"', 'label: "骰子"', "once"),
        ('label: "Dice: Everyone"', 'label: "骰子：所有人"', "once"),
        ('label: "Immersive HTML"', 'label: "沉浸式 HTML"', "once"),
        ('label: "Death System"', 'label: "死亡系统"', "once"),
        ('label: "Combat System"', 'label: "战斗系统"', "once"),
        ('label: "Direct Language"', 'label: "直白语言"', "once"),
        ('label: "Dialogue Colors"', 'label: "对话配色"', "once"),
        ('label: "Organic NPCs & Events"', 'label: "自然 NPC 与事件"', "once"),
        ('label: "Dialogue & Narration Format"', 'label: "对话与旁白格式"', "once"),
    ],
    # ═══════════════════════════ data/blocks.js ═══════════════════════════
    "data/blocks.js": [
        ('label: "World State Block"', 'label: "世界状态信息块"', "once"),
        ('label: "CYOA Block"', 'label: "CYOA 信息块"', "once"),
        ('label: "MVU Compatibility"', 'label: "MVU 兼容性"', "once"),
        ('label: "NPC Inner Chatter"', 'label: "NPC 内心独白"', "once"),
    ],
}
