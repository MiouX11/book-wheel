#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 data/distilled/*.md 打包成 assets/js/distilled-data.js。

用法：
    python build_distilled.py            # 构建
    python build_distilled.py --check    # 只校验，不写文件

约定：
  * 书籍顺序取自 assets/js/data.js 里的 books 数组
  * 每篇正文来自 data/distilled/<id>.md
  * 输出 window.DISTILLED_DATA = {...}; 单行 JSON（与既有格式保持一致）
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(ROOT, 'data', 'distilled')
DATA_JS = os.path.join(ROOT, 'assets', 'js', 'data.js')
OUT_JS = os.path.join(ROOT, 'assets', 'js', 'distilled-data.js')


def book_order():
    txt = io.open(DATA_JS, encoding='utf-8').read()
    m = re.search(r'const DATA = (\{.*?\});', txt, re.S)
    if not m:
        raise SystemExit('无法从 data.js 解析书目')
    return [b['id'] for b in json.loads(m.group(1))['books']]


def main():
    check = '--check' in sys.argv
    order = book_order()

    out = {}
    missing, empty = [], []
    for bid in order:
        p = os.path.join(SRC_DIR, bid + '.md')
        if not os.path.exists(p):
            missing.append(bid)
            continue
        body = io.open(p, encoding='utf-8').read().replace('\r\n', '\n').strip()
        if not body:
            empty.append(bid)
            continue
        out[bid] = body

    # 也收编 data/distilled 里存在、但不在书目中的文件（避免静默丢内容）
    known = set(order)
    extra = [f[:-3] for f in sorted(os.listdir(SRC_DIR))
             if f.endswith('.md') and f[:-3] not in known]
    for bid in extra:
        body = io.open(os.path.join(SRC_DIR, bid + '.md'), encoding='utf-8').read().strip()
        if body:
            out[bid] = body

    lens = [len(v) for v in out.values()]
    print('书目 %d 本；已打包 %d 篇；缺 md %d；空文件 %d'
          % (len(order), len(out), len(missing), len(empty)))
    if lens:
        print('字数: 最短 %d / 最长 %d / 平均 %d' % (min(lens), max(lens), sum(lens) // len(lens)))
    if missing:
        print('[!] 缺 md: %s' % missing)
    if extra:
        print('[i] 额外收编（不在书目中）: %s' % extra)

    payload = 'window.DISTILLED_DATA = ' + json.dumps(out, ensure_ascii=False) + ';\n'

    if check:
        print('[check] 未写文件。目标文件当前 %d 字节；本次将生成 %d 字节'
              % (os.path.getsize(OUT_JS) if os.path.exists(OUT_JS) else -1,
                 len(payload.encode('utf-8'))))
        return 0

    with io.open(OUT_JS, 'w', encoding='utf-8', newline='\n') as f:
        f.write(payload)
    print('已写入 %s (%d 字节)' % (OUT_JS, len(payload.encode('utf-8'))))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
