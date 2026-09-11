#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""往 assets/js/data.js 的 books 数组里追加新书（保持文件其余部分不变）。

用法：
    python add_books.py --file new_books.json      # 追加
    python add_books.py --file new_books.json --check
"""
import argparse
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(ROOT, 'assets', 'js', 'data.js')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', required=True)
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--update', action='store_true',
                    help='已存在的 id 则合并字段（用于补 enTitle 等），而不是跳过')
    args = ap.parse_args()

    src = io.open(DATA_JS, encoding='utf-8').read()
    m = re.search(r'const DATA = (\{.*?\});', src, re.S)
    if not m:
        raise SystemExit('无法解析 data.js')
    DATA = json.loads(m.group(1))

    new = json.load(io.open(args.file, encoding='utf-8'))
    books = DATA['books']
    existing = {b['id'] for b in books}
    cats = {c['id'] for c in DATA['categories']}

    added, skipped, updated = [], [], []
    by_id = {b['id']: b for b in books}
    for b in new:
        for k in ('id', 'categoryId', 'title', 'author', 'readMinutes', 'question'):
            if k not in b:
                raise SystemExit('新书缺字段 %s: %s' % (k, b.get('id')))
        if b['id'] in existing:
            if args.update:
                by_id[b['id']].update(b)
                updated.append(b['id'])
            else:
                skipped.append(b['id'])
            continue
        if b['categoryId'] not in cats:
            raise SystemExit('未知类别 %s (%s)' % (b['categoryId'], b['id']))
        books.append(b)
        existing.add(b['id'])
        added.append(b['id'])

    print('新书 %d 本：新增 %d，更新 %d，跳过重复 %d'
          % (len(new), len(added), len(updated), len(skipped)))
    if skipped:
        print('  已存在: %s' % skipped)
    if updated:
        print('  已更新: %s' % updated)
    print('书目总数: %d' % len(books))
    from collections import Counter
    c = Counter(b['categoryId'] for b in books)
    print('  各类别: %s' % dict(c))

    if not added and not updated:
        print('无改动')
        return 0

    payload = 'const DATA = ' + json.dumps(DATA, ensure_ascii=False,
                                           separators=(',', ':')) + ';'
    out = src[:m.start()] + payload + src[m.end():]

    if args.check:
        print('[check] 未写盘')
        return 0
    io.open(DATA_JS, 'w', encoding='utf-8', newline='\n').write(out)
    print('已写入 %s (%d 字节)' % (DATA_JS, len(out.encode('utf-8'))))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
