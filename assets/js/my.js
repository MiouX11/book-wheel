// 我的：读过的书，按分类聚合
(function () {
  const header = document.getElementById("my-header");
  const listEl = document.getElementById("my-list");

  async function render() {
    // 等 Auth 至少走一遍初始化（session getUser 是异步）
    await new Promise((resolve) => {
      if (!window.Auth || !Auth.isReady()) return resolve();
      let done = false;
      Auth.onChange(() => { if (!done) { done = true; resolve(); } });
      setTimeout(resolve, 800);
    });

    const user = Auth?.getUser?.();
    const configured = Auth?.isReady?.();

    // 头部
    if (user) {
      header.innerHTML = `
        <h1>我的读书清单</h1>
        <p class="my-sub">已登录：<b>${escape(user.email || "")}</b>
          <button id="logout-btn" class="btn btn-ghost btn-sm">退出</button>
        </p>
      `;
      document.getElementById("logout-btn").onclick = async () => {
        await Auth.signOut();
        location.reload();
      };
    } else if (configured) {
      header.innerHTML = `
        <h1>我的读书清单</h1>
        <p class="my-sub">当前记录在本机浏览器。<a href="login.html">登录后</a>可多设备同步。</p>
      `;
    } else {
      header.innerHTML = `
        <h1>我的读书清单</h1>
        <p class="my-sub">记录在本机浏览器。（Supabase 未配置，暂不支持账号同步）</p>
      `;
    }

    // 列表
    const reads = await Reads.list();
    if (reads.length === 0) {
      listEl.innerHTML = `
        <div class="empty">
          <p>还没有读过的书。</p>
          <a class="btn btn-primary" href="index.html">去首页转一转</a>
        </div>
      `;
      return;
    }

    const [categories, books] = await Promise.all([
      BookData.getCategories(),
      BookData.getBooks(),
    ]);
    const bookMap = new Map(books.map((b) => [b.id, b]));
    const catMap = new Map(categories.map((c) => [c.id, c]));

    // 按分类分组
    const byCat = new Map();
    reads.forEach((r) => {
      const b = bookMap.get(r.book_id);
      if (!b) return;
      const arr = byCat.get(b.categoryId) || [];
      arr.push({ book: b, at: r.created_at });
      byCat.set(b.categoryId, arr);
    });

    let html = `<p class="my-stat">共读过 <b>${reads.length}</b> 本 · 覆盖 <b>${byCat.size}</b> 个类别</p>`;
    for (const cat of categories) {
      const items = byCat.get(cat.id);
      if (!items || !items.length) continue;
      html += `
        <div class="my-cat-block">
          <h2 class="my-cat-title" style="color:${cat.color}">
            ${cat.icon} ${escape(cat.name)}
            <span class="cnt">${items.length}</span>
          </h2>
          <div class="my-cards">
            ${items.map((it) => card(it, cat)).join("")}
          </div>
        </div>
      `;
    }
    listEl.innerHTML = html;
    Cover.upgradeAll(listEl);
  }

  function card(item, cat) {
    const b = item.book;
    const date = item.at ? new Date(item.at).toLocaleDateString("zh-CN") : "";
    return `
      <a class="my-card" href="book.html?id=${encodeURIComponent(b.id)}">
        ${Cover.html(b, cat, { mini: true })}
        <div class="my-card-body">
          <div class="my-card-title">《${escape(b.title)}》</div>
          <div class="my-card-author">${escape(b.author)}</div>
          <div class="my-card-date">${date}</div>
        </div>
      </a>
    `;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  render().catch((e) => {
    console.error(e);
    listEl.innerHTML = `<div class="empty"><p>加载失败：${escape(e.message)}</p></div>`;
  });
})();
