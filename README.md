# 简书 · 纯净高知学习社区

一个极简的「精读引导」学习社区。首页可以随机抽一本书，先抛一个思考题，再看 10 分钟精读稿；读完可以在书下面写**感悟**（图文），所有感悟会汇总到首页的**社区**板块。

线上地址：https://mioux11.github.io/book-wheel/
书库：https://mioux11.github.io/book-wheel/library.html

## 目录

```
book-wheel/
├── index.html                # 首页 - 随机抽书 + 社区板块
├── library.html              # 书库（瀑布流）
├── book.html                 # 书详情（问题 → 精读 → 感悟）
├── people.html               # 人物志
├── my.html                   # 我的
├── login.html                # 登录/注册
├── supabase-schema.sql       # Supabase 建表 + Storage + RLS（整份粘贴运行）
├── data/
│   ├── books.json
│   └── distilled/            # 精读正文的 Markdown 源（每本一个 .md）
└── assets/
    ├── css/style.css
    ├── covers/<id>.jpg       # 封面（本地图，不走外链）
    ├── img/
    └── js/
        ├── supabase-config.js    # ← 填 Supabase URL / anon key（就这两个值）
        ├── data.js               # 书目数据
        ├── auth.js               # Supabase 认证
        ├── reads.js             # 「读过的书」读写：云 + 本地
        ├── reflections.js       # 感悟读写：云 + 本地，含图片压缩上传
        ├── book-reflect.js      # 书页底部的「感悟」栏目
        ├── community.js         # 首页「社区」板块
        ├── book.js / library.js / my.js / picker.js / cover.js / icons.js
        └── reveal.js            # 滚动渐显
```

## 本地预览

```powershell
cd C:\Users\19396\Documents\book-wheel
python -m http.server 8000
# 打开 http://localhost:8000/
```

## 感悟 / 社区 是怎么工作的

| | 未配 Supabase | 配好 Supabase 后 |
|---|---|---|
| 能发感悟（图文） | ✅ 能 | ✅ 能 |
| 内容存在哪 | 本机浏览器（localStorage） | 云端数据库 + Storage |
| 别人看得到吗 | ❌ 只有自己这台设备能看到 | ✅ 所有人可见 |
| 需要登录吗 | 不需要 | 需要（要登录才能发/删） |

代码是**双模式**的：同一个页面，会自动检测 Supabase 是否配好、是否已登录，然后走云端或本地。
所以你随时可以「先不配、先用着」，等想开社区了再配 —— 不用改任何代码。

图片会先在浏览器里压缩到最长边 1280px 再上传，所以手机拍的原图也不会拖慢加载。每条最多 3 张。

---

## 开启社区（3 步，约 5 分钟）

> 目的：让每个人发的感悟都能被所有人看见。不配的话站点仍然能用，只是感悟只存在自己本机。

### 1. 建一个免费的 Supabase 项目
1. 打开 [supabase.com](https://supabase.com/) → 用 GitHub 登录
2. New Project → 名字随便填（如 `jianshu`）
3. 数据库密码随便生成一个（记下但用不到）
4. Region 选 `Northeast Asia (Tokyo)` → Create，等 1-2 分钟

### 2. 粘贴运行 SQL
1. 项目左侧进 **SQL Editor** → New query
2. 打开本仓库的 `supabase-schema.sql`，**全部内容粘贴进去** → Run
3. 看到 `Success. No rows returned` 就成功了

这一步会一次性建好：`reads`（已读）、`reflections`（感悟）两张表、图片存储桶 `reflections`、以及所有权限策略。

### 3. 把两个值填进配置文件
1. 项目里进 **Settings → API**
2. 复制 **Project URL** 和 **anon public** 那个 key
3. 打开 `assets/js/supabase-config.js`，填进去：

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi...",
};
```

4. 提交并推送：

```powershell
cd C:\Users\19396\Documents\book-wheel
git add assets/js/supabase-config.js
git commit -m "chore: 接入 Supabase，开启社区"
git push
```

### 另外还要开一下邮箱注册
- Supabase 项目里进 **Authentication → Providers → Email** → 打开 **Enable Email provider**
- 想省事就把 **Confirm email** 关掉，否则新用户注册后要收邮件点链接才能登录

配好后打开 `login.html` 就能注册/登录，登录之后在书页底部发感悟，首页社区就会实时出现。

---

## 加书 / 改书

- `assets/js/data.js` 是书目数据源（`categories` + `books`）
- `data/distilled/<id>.md` 是每本书的精读正文（Markdown 的单一源）
- 改完正文后跑一次打包，把 md 合成 `assets/js/distilled-data.js`：

```powershell
python build_distilled.py      # md → distilled-data.js
python normalize_distilled.py  # （可选）补「开篇问题」+ 重排章节编号
python add_books.py --file 新书.json   # 批量追加书目
python fetch_covers.py --ids a,b,c    # 抓封面到 assets/covers/
```

改完 `git push` 就上线，不用重启不用构建。

## 技术

- 原生 HTML/CSS/JS，无框架无构建
- Supabase JS v2（CDN）→ 账号、感悟、图片存储
- marked v12（CDN）→ 渲染 Markdown
- 图片上传前在 canvas 里压缩，避免大图

## 已知限制

- 删除感悟时，云端 Storage 里的图片**不会自动删除**（会在桶里留一份）。量不大可以先不管；要清理可以在 Supabase → Storage 里手动删。
- 本地模式（未配 Supabase）下，感悟存在 localStorage，上限约 5MB，脚本会最多保留最近 40 条。

## SEO

未加 noindex。如需隐藏搜索引擎收录，可在各 HTML 的 `<head>` 加：

```html
<meta name="robots" content="noindex, nofollow">
```
