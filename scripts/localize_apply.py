#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Megumin-Suite 中文本地化应用器
读取 scripts/zh_map_batch*.py 中的映射，对仓库文件做精确子串替换。
- mode "once"：目标子串必须恰好出现 1 次，否则报错
- mode "all" ：替换全部出现次数
用法：python3 scripts/localize_apply.py [batch1] [batch2] ...
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
sys.path.insert(0, SCRIPTS)


def load_maps(batches):
    maps = {}
    for b in batches:
        mod = __import__(f"zh_map_{b}")
        for rel, pairs in mod.MAPS.items():
            maps.setdefault(rel, []).extend(pairs)
    return maps


def main():
    batches = sys.argv[1:] or ["batch1_core"]
    maps = load_maps(batches)
    total = 0
    for rel, pairs in maps.items():
        path = os.path.join(ROOT, rel)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        for old, new, mode in pairs:
            c = text.count(old)
            if c == 0 and new in text:
                continue  # 已应用（幂等重跑）
            if mode == "once":
                if c != 1:
                    print(f"  !! {rel}: '{old[:60]}...' 出现 {c} 次（应为 1）")
                    sys.exit(1)
                text = text.replace(old, new, 1)
            else:
                text = text.replace(old, new)
            total += 1
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"  [OK] {rel}: {len(pairs)} 处")
    print(f"共应用 {total} 条替换")


if __name__ == "__main__":
    main()
