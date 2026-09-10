// 首页：类目 chip 直接跳转到书库，不需要抽奖
(async function () {
  const chipsEl = document.getElementById("cat-chips");
  const btn = document.getElementById("pick-btn");
  const status = document.getElementById("picker-status");

  let categories = [];
  let books = [];
  let catById = new Map();
  try {
    [categories, books] = await Promise.all([
      BookData.getCategories(),
      BookData.getBooks(),
    ]);
    catById = new Map(categories.map((c) => [c.id, c]));
  } catch (e) {
    status.textContent = "书目加载失败，请刷新重试";
    console.error(e);
    return;
  }

  // ---------- 封面预加载 ----------
  // 原先转轮用 loading="lazy"，而转轮初始被平移到视口外，
  // 懒加载经常来不及触发 —— 转出时看到的是占位色块而不是封面。
  const coverCache = new Map(); // src -> Promise<boolean>

  function coverSrc(b) {
    return `assets/covers/${b.id}.jpg`;
  }

  function preloadCover(b) {
    const src = coverSrc(b);
    let p = coverCache.get(src);
    if (!p) {
      p = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
      coverCache.set(src, p);
    }
    return p;
  }

  // 页面空闲时后台逐批预热全部封面（每批 4 张，不抢首屏）
  function warmUpCovers() {
    let i = 0;
    const idle = (fn) => {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 400 });
      else setTimeout(fn, 180);
    };
    const step = () => {
      for (let n = 0; n < 4 && i < books.length; n++, i++) preloadCover(books[i]);
      if (i < books.length) idle(step);
    };
    idle(step);
  }

  // 数据就绪后立刻在后台预热封面，抽奖时直接命中缓存
  warmUpCovers();

  // 渲染类目 chip - 直接跳转到书库
  chipsEl.innerHTML = categories
    .map(
      (c) => `<button class="chip" role="listitem"
        data-cat="${c.id}"
        style="--chip-color:${c.color}">
        <span class="chip-icon">${getIcon(c.icon, 16)}</span>
        <span class="chip-label">${c.name}</span>
      </button>`
    )
    .join("");

  chipsEl.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    const cat = chip.dataset.cat;
    const inCat = books.filter((b) => b.categoryId === cat);
    if (!inCat.length) {
      status.textContent = "这个类别下暂无书目";
      return;
    }
    // 直接跳转到书库该类别
    location.href = `library.html?cat=${encodeURIComponent(cat)}`;
  });

  btn.addEventListener("click", () => {
    // 保持随机抽一本功能
    const pool = books;
    if (!pool.length) return;
    const book = pool[Math.floor(Math.random() * pool.length)];
    openCase(pool, null, book);
  });

  let busy = false;

  function pick(pool, cat) {
    if (busy || !pool.length) return;
    const book = pool[Math.floor(Math.random() * pool.length)];
    openCase(pool, cat, book);
  }

  function openCase(pool, cat, book) {
    busy = true;
    document.body.style.overflow = "hidden";

    const N = 40;
    const TARGET = 37;
    const STEP = 106;
    const CARD = 96;
    const DURATION = 3600;

    const items = [];
    for (let i = 0; i < N; i++) items.push(pool[Math.floor(Math.random() * pool.length)]);
    items[TARGET] = book;

    const overlay = document.createElement("div");
    overlay.className = "case-overlay";
    overlay.innerHTML = `
      <div class="case-modal">
        <div class="case-title">${cat ? `开箱 · ${getIcon(cat.icon, 18)} ${escape(cat.name)}` : "开箱 · 随机抽一本"}</div>
        <div class="case-viewport">
          <div class="case-pointer"></div>
          <div class="case-reel">${items.map(cardHtml).join("")}</div>
        </div>
        <div class="case-result"></div>
        <div class="case-actions hidden">
          <button class="btn btn-primary case-go">去阅读 →</button>
          <button class="btn btn-ghost case-again">再抽一次</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const reel = overlay.querySelector(".case-reel");
    const viewport = overlay.querySelector(".case-viewport");
    const resultEl = overlay.querySelector(".case-result");
    const actionsEl = overlay.querySelector(".case-actions");

    requestAnimationFrame(() => overlay.classList.add("show"));

    const W = viewport.clientWidth;
    const initialX = W / 2 - CARD / 2;
    const finalX = W / 2 - (TARGET * STEP + CARD / 2);

    reel.style.transform = `translateX(${initialX}px)`;

    let finished = false;

    function finish() {
      const cards = reel.querySelectorAll(".case-card");
      const hit = cards[TARGET];
      if (hit) hit.classList.add("hit");
      const c = catById.get(book.categoryId);
      resultEl.innerHTML = `
        <div class="case-book-title">《${escape(book.title)}》</div>
        <div class="case-book-meta">${getIcon(c.icon, 14)} ${escape(c.name)} · ${escape(book.author)}</div>
      `;
      actionsEl.classList.remove("hidden");
      finished = true;
      busy = false;
    }

    // 起转前先确保"开奖落点及相邻几张"就绪（这几张才是用户真正看到的），
    // 其余 40 张已去掉 lazy 会并行加载；最多等 700ms，不拖垮开箱节奏。
    const keyCards = items.slice(Math.max(0, TARGET - 2), TARGET + 3);
    const keyReady = Promise.all(keyCards.map(preloadCover));
    Promise.race([keyReady, new Promise((r) => setTimeout(r, 700))]).then(() => {
      setTimeout(() => {
        reel.style.transition = `transform ${DURATION}ms cubic-bezier(0.12, 0.8, 0.08, 1)`;
        reel.style.transform = `translateX(${finalX}px)`;
      }, 140);
      setTimeout(finish, 140 + DURATION + 120);
    });

    overlay.querySelector(".case-go").addEventListener("click", () => {
      location.href = `book.html?id=${encodeURIComponent(book.id)}`;
    });
    overlay.querySelector(".case-again").addEventListener("click", () => {
      overlay.remove();
      pick(pool, cat);
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay && finished) {
        overlay.remove();
        document.body.style.overflow = "";
      }
    });
  }

  function cardHtml(b) {
    const c = catById.get(b.categoryId);
    return `
      <div class="case-card" style="--accent:${c.color}">
        <span class="case-char" style="background:linear-gradient(135deg,${c.color},${c.color}cc)">${escape(b.title[0])}</span>
        <img src="assets/covers/${b.id}.jpg" alt="" decoding="async" onerror="this.remove()">
      </div>
    `;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
})();
