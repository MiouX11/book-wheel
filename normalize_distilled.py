#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""对 data/distilled/*.md 做两项机械处理：

  1. 在标题+引语之后插入「## 开篇问题」段落（内容取自 assets/js/data.js 的 question 字段）
  2. 把编号小节（## 一、/ ## 六、…）按出现顺序重新编号，修掉往轮追加造成的重复编号

只改这两处，不动正文内容。

用法：
    python normalize_distilled.py --check          # 预览将要做的改动
    python normalize_distilled.py                  # 实际写入
    python normalize_distilled.py --only <id>      # 只处理一本
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'data', 'distilled')
DATA_JS = os.path.join(ROOT, 'assets', 'js', 'data.js')

CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']


def cn_num(n):
    """1 -> 一, 10 -> 十, 11 -> 十一, 20 -> 二十"""
    if n <= 0:
        return ''
    if n < 10:
        return CN[n]
    if n == 10:
        return '十'
    if n < 20:
        return '十' + CN[n - 10]
    if n % 10 == 0:
        return CN[n // 10] + '十'
    return CN[n // 10] + '十' + CN[n % 10]


HEAD_RE = re.compile(r'^##\s*[一二三四五六七八九十]+、\s*(.*)$')


def load_books():
    txt = io.open(DATA_JS, encoding='utf-8').read()
    m = re.search(r'const DATA = (\{.*?\});', txt, re.S)
    return {b['id']: b for b in json.loads(m.group(1))['books']}


def transform(md, question):
    """返回 (新文本, 说明)"""
    lines = md.replace('\r\n', '\n').rstrip('\n').split('\n')
    notes = []

    # ---- 1. 插入开篇问题 ----
    if any(l.strip() == '## 开篇问题' for l in lines):
        notes.append('已有开篇问题（跳过插入）')
    else:
        ins = None
        if lines and lines[0].startswith('# '):
            i = 1
            last = -1
            while i < len(lines):
                s = lines[i].strip()
                if s.startswith('>'):
                    last = i
                    i += 1
                    continue
                if last >= 0 and s == '':
                    i += 1
                    continue
                if last >= 0:
                    break
                if s == '':
                    i += 1
                    continue
                break
            ins = (last + 1) if last >= 0 else 1
        if ins is None:
            notes.append('未找到标题行，跳过插入')
        else:
            block = ['', '## 开篇问题', '', question.strip()]
            lines[ins:ins] = block
            notes.append('已插入开篇问题（第 %d 行处）' % (ins + 1))

    # ---- 2. 重排编号 ----
    n = 0
    renamed = 0
    for idx, ln in enumerate(lines):
        m = HEAD_RE.match(ln.strip())
        if m:
            n += 1
            want = cn_num(n)
            got = re.match(r'^##\s*([一二三四五六七八九十]+)、', ln.strip()).group(1)
            rest = m.group(1)
            lines[idx] = '## %s、%s' % (want, rest)
            if got != want:
                renamed += 1
    notes.append('编号小节 %d 个，修正 %d 个' % (n, renamed))

    return '\n'.join(lines).rstrip('\n') + '\n', '；'.join(notes)


def main():
    check = '--check' in sys.argv
    only = None
    if '--only' in sys.argv:
        only = sys.argv[sys.argv.index('--only') + 1]

    books = load_books()
    ids = [only] if only else [b['id'] for b in books.values()]
    changed = 0
    for bid in ids:
        p = os.path.join(SRC, bid + '.md')
        if not os.path.exists(p):
            print('  [!] 缺 %s' % bid)
            continue
        md = io.open(p, encoding='utf-8').read()
        q = (books.get(bid, {}).get('question') or '').strip()
        if not q:
            print('  [!] %s 没有 question 字段，跳过' % bid)
            continue
        new, note = transform(md, q)
        delta = len(new.strip()) - len(md.strip())
        if new != md:
            changed += 1
        print('  %-30s %5d -> %5d (%+d)  %s' % (bid, len(md.strip()), len(new.strip()), delta, note))
        if not check:
            io.open(p, 'w', encoding='utf-8', newline='\n').write(new)

    print()
    print('%s：%d 个文件%s' % ('预览' if check else '已写入', changed, '（未写盘）' if check else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
