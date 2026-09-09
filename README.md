# 读书转盘（book-wheel）

一个极简的"精读引导"读书站。首页是转盘，随机选一个类别→随机出一本书→先抛一个思考题→再看 10 分钟精读稿。读完的书会记在"我的"里。

在线体验：待部署到 GitHub Pages 后填此处。

## 目录

```
book-wheel/
├── index.html                # 首页 - 转盘
├── book.html                 # 书详情（问题 → 精读两段式）
├── my.html                   # 我的
├── login.html                # 登录/注册
├── .nojekyll                 # 关闭 GitHub Pages 的 Jekyll
├── supabase-schema.sql       # Supabase 建表 + RLS 策略
├── data/
│   └── books.json            # 类别 + 书籍数据（想加书改这个）
└── assets/
    ├── css/style.css
    └── js/
        ├── supabase-config.js    # 填 Supabase URL / anon key
        ├── data.js               # 加载 books.json
        ├── auth.js               # Supabase 认证
        ├── reads.js              # "读过的书"读写：云 + 本地
        ├── wheel.js              # 转盘
        ├── book.js               # 书页
        └── my.js                 # 我的
```

## 本地预览

```powershell
cd C:\Users\19396\Documents\book-wheel
python -m http.server 8000
# 打开 http://localhost:8000/
```

## 部署到 GitHub Pages

1. 在 GitHub 建仓库 `book-wheel`（用现有账号 `MiouX11`）
2. 本地初始化并推送：
   ```powershell
   cd C:\Users\19396\Documents\book-wheel
   git init
   git add .
   git commit -m "init: 读书转盘站首版"
   git branch -M main
   git remote add origin https://github.com/MiouX11/book-wheel.git
   git push -u origin main
   ```
3. 仓库 Settings → Pages → Source 选 `main` 分支 `/ (root)` → Save
4. 等 1-2 分钟，站点上线：`https://mioux11.github.io/book-wheel/`

## 接入 Supabase（可选，用来多设备同步"读过的书"）

不配也能用，未登录会自动降级用浏览器本地存储（换设备/清缓存会丢）。

### 1. 建项目
1. 打开 [supabase.com](https://supabase.com/) 用 GitHub 登录
2. New Project → 名字随便（如 `book-wheel`）→ 生成一个数据库密码（记下但用不到）→ Region 选 `Northeast Asia (Tokyo)` → Create

### 2. 建表
1. 项目里进 SQL Editor
2. 打开本仓库的 `supabase-schema.sql`，把内容全部粘贴进去，点 Run
3. 应看到 "Success. No rows returned"

### 3. 拿 URL 和 anon key
1. 项目里进 Settings → API
2. 复制 `Project URL` 和 `anon public` 那一栏的 key
3. 编辑本地 `assets/js/supabase-config.js`，把两个值填进去，`git push` 更新到 Pages

### 4. 允许邮箱注册
- Authentication → Providers → Email → 打开 "Enable Email provider"
- 想省事就把 "Confirm email" 关掉，不然新用户注册后要收邮件点链接才能登录

配好后打开 `login.html` 就能注册/登录了。

## 加书 / 改书

编辑 `data/books.json`：
- `categories` 数组决定转盘上的类别（改颜色、加图标随意）
- `books` 数组是所有书，`categoryId` 对上 `categories` 里的 `id` 即可
- `distilled` 是精读正文，用 Markdown 写，支持标题、列表、引用、加粗

改完 `git push` 就上线了，不用重启不用构建。

## 技术

- 原生 HTML/CSS/JS，无框架无构建
- Supabase JS v2（CDN）用于账号 + 数据同步
- marked v12（CDN）渲染 Markdown

## SEO

未加 noindex。如需隐藏搜索引擎收录，可在各 HTML 的 `<head>` 加：

```html
<meta name="robots" content="noindex, nofollow">
```
