#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按「书名 + 作者」抓取封面，存为 assets/covers/<id>.jpg。

为什么不用纯 ISBN：老脚本 dl_final.py 依赖准确的 ISBN-10，新增书很难保证。
这里改为先用 Open Library 搜索（书名+作者）拿到封面 id，再下载；
失败则退回 Amazon 的 ISBN 封面图（该域名本机可直连）。

环境说明：
  * openlibrary.org 本机直连不通，必须走本地代理（默认 127.0.0.1:10793）
  * 该代理会 MITM TLS，必须关闭证书校验，否则 CERTIFICATE_VERIFY_FAILED
  * Google Books 在此网络下 429 限流，故不作为首选

用法：
    python fetch_covers.py --ids id1,id2
    python fetch_covers.py --all-missing      # 书目里所有缺封面的
"""
import argparse
import io
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(ROOT, 'assets', 'js', 'data.js')
COVERS = os.path.join(ROOT, 'assets', 'covers')
PROXY = 'http://127.0.0.1:10793'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; book-wheel-cover-fetch/1.0)'}

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE
_opener = urllib.request.build_opener(
    urllib.request.ProxyHandler({'http': PROXY, 'https': PROXY}),
    urllib.request.HTTPSHandler(context=_ctx))
_direct = urllib.request.build_opener(urllib.request.HTTPSHandler(context=_ctx))

MIN_BYTES = 6000


def fetch(url, opener=None, timeout=30, retries=3):
    """带重试：本机代理链路偶发 SSL EOF，重试通常能过。"""
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return (opener or _opener).open(req, timeout=timeout).read()
        except Exception as e:
            last = e
            time.sleep(1.2 * (i + 1))
    raise last


def load_books():
    txt = io.open(DATA_JS, encoding='utf-8').read()
    m = re.search(r'const DATA = (\{.*?\});', txt, re.S)
    return json.loads(m.group(1))['books']


def ol_cover(title, author, en_title='', en_author=''):
    """Open Library 搜索 -> (cover_bytes, 说明)

    注意：Open Library 基本搜不到中文书名（实测命中 0），必须用英文名；
    且不要在英文书名后拼中文作者名（也会命中 0）。
    """
    tried = []
    attempts = []
    if en_title:
        attempts.append((en_title, en_author))
    attempts.append((title, author))
    for t, a in attempts:
        key = '%s|%s' % (t, a)
        if not t or key in tried:
            continue
        tried.append(key)
        q = urllib.parse.quote(('%s %s' % (t, a)).strip())
        url = ('https://openlibrary.org/search.json?q=%s&limit=5'
               '&fields=title,author_name,cover_i,isbn' % q)
        try:
            d = json.loads(fetch(url))
        except Exception:
            continue
        for doc in d.get('docs', []):
            ci = doc.get('cover_i')
            if not ci:
                continue
            try:
                img = fetch('https://covers.openlibrary.org/b/id/%s-L.jpg' % ci, timeout=40)
            except Exception:
                continue
            if len(img) > MIN_BYTES:
                return img, 'OpenLibrary[%s] cover_i=%s' % (t[:18], ci)
    return None, 'OpenLibrary 无可用封面'


def amazon_cover(isbn10):
    if not isbn10 or isbn10 == '0000000000':
        return None, '无 ISBN'
    url = 'https://images-na.ssl-images-amazon.com/images/P/%s.01.LZZZZZZZ.jpg' % isbn10
    try:
        img = fetch(url, opener=_direct, timeout=30)
    except Exception as e:
        return None, 'Amazon %s' % type(e).__name__
    if len(img) > MIN_BYTES:
        return img, 'Amazon isbn=%s' % isbn10
    return None, 'Amazon 占位图'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids', default='')
    ap.add_argument('--all-missing', action='store_true')
    ap.add_argument('--sleep', type=float, default=1.5)
    args = ap.parse_args()

    books = {b['id']: b for b in load_books()}

    if args.ids:
        todo = [x.strip() for x in args.ids.split(',') if x.strip()]
    elif args.all_missing:
        todo = [b['id'] for b in books.values()
                if not os.path.exists(os.path.join(COVERS, b['id'] + '.jpg'))]
    else:
        print('请指定 --ids 或 --all-missing')
        return 2

    ok = fail = 0
    for bid in todo:
        b = books.get(bid)
        if not b:
            print('  [!] %s 不在书目里' % bid, flush=True)
            continue
        path = os.path.join(COVERS, bid + '.jpg')
        img = None
        notes = []
        for fn in (lambda: ol_cover(b['title'], b.get('author', ''),
                                    b.get('enTitle', ''), b.get('enAuthor', '')),
                   lambda: amazon_cover(b.get('isbn10', ''))):
            try:
                got, note = fn()
            except Exception as e:
                got, note = None, '%s: %s' % (type(e).__name__, e)
            notes.append(note)
            if got:
                img = got
                break
        note = ' | '.join(notes)
        if img:
            io.open(path, 'wb').write(img)
            ok += 1
            print('  ✅ %-32s %-28s %d KB' % (bid, note, len(img) // 1024), flush=True)
        else:
            fail += 1
            print('  ❌ %-32s %s' % (bid, note), flush=True)
        time.sleep(args.sleep)

    print('\n完成：成功 %d，失败 %d' % (ok, fail))
    return 0 if fail == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
