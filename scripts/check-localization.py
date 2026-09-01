#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Megumin-Suite 中文本地化验收：id/key 一致性检查
用法：git diff -U0 | python3 scripts/check-localization.py
要求：diff 中被删除行与新增行的 id:/key: 值集合完全一致（即只改了显示字段，未改逻辑键）。
返回码：0=通过；1=发现 id/key 变化。
"""
import re
import sys

diff = sys.stdin.read()
removed = set(re.findall(r'^-\s*.*?\b(id|key): "([^"]+)"', diff, re.M))
added = set(re.findall(r'^\+\s*.*?\b(id|key): "([^"]+)"', diff, re.M))
if removed == added:
    print(f"id/key 一致性：PASS（{len(removed)} 个逻辑键全部保留）")
    sys.exit(0)
else:
    diffset = removed ^ added
    print(f"id/key 一致性：FAIL（差异 {len(diffset)} 个：{sorted(diffset)}）")
    sys.exit(1)
