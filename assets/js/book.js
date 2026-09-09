// 书详情：先问题卡 → 点击展开精读 → 底部标记已读
(async function () {
  const main = document.getElementById("book-main");
  const progress = document.getElementById("reading-progress");
  const params = new URLSearchParams(location.search);
  const bookId = params.get("id");

  if (!bookId) {
    main.innerHTML = `<div class="empty">
      <p>缺少书籍 ID</p>
      <a class="btn" href="index.html">回首页转一下</a>
    </div>`;
    return;
  }

  const [book] = await Promise.all([BookData.getBookById(bookId)]);
  if (!book) {
    main.innerHTML = `<div class="empty">
      <p>找不到这本书</p>
      <a class="btn" href="index.html">回首页转一下</a>
    </div>`;
    return;
  }
  const category = await BookData.getCategoryById(book.categoryId);
  const alreadyRead = await Reads.has(book.id);

  document.title = `《${book.title}》· 读书转盘`;

  const coverHtml = Cover.html(book, category);

  main.innerHTML = `
    <article class="ask-card">
      <div class="ask-card-inner">
        ${coverHtml}
        <div class="ask-meta">
          <span class="tag" style="background:${category.color}22;color:${category.color};border-color:${category.color}66">
            ${category.icon} ${escapeHtml(category.name)}
          </span>
          <h1 class="book-title">《${escapeHtml(book.title)}》</h1>
          <p class="book-author">${escapeHtml(book.author)}</p>
          <p class="book-min">约 ${book.readMinutes || 10} 分钟精读</p>
        </div>
      </div>
      <div class="question-block">
        <div class="q-label">先想一下这个问题：</div>
        <p class="question">${escapeHtml(book.question)}</p>
      </div>
      <button id="reveal-btn" class="btn btn-primary btn-lg">想好了，开始 10 分钟精读 →</button>
      <a class="btn btn-ghost" href="index.html">🎲 换一本</a>
    </article>

    <section id="distilled" class="distilled hidden" aria-hidden="true">
      <div class="distilled-body markdown"></div>
      <div class="finish-bar">
        <button id="mark-btn" class="btn btn-primary">${alreadyRead ? "✓ 已标记读过" : "♥ 标记为读过"}</button>
        <a class="btn btn-ghost" href="index.html">🎲 再转一次</a>
      </div>
    </section>
  `;

  Cover.upgradeAll(main);

  const revealBtn = document.getElementById("reveal-btn");
  const distilledEl = document.getElementById("distilled");
  const markBtn = document.getElementById("mark-btn");

  revealBtn.addEventListener("click", async () => {
    revealBtn.disabled = true;
    revealBtn.textContent = "加载精读稿……";
    const md = await BookData.getDistilled(book.id);
    distilledEl.querySelector(".distilled-body").innerHTML = marked.parse(md);
    distilledEl.classList.remove("hidden");
    distilledEl.setAttribute("aria-hidden", "false");
    revealBtn.remove();
    setTimeout(() => {
      distilledEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  });

  let marked_ = alreadyRead;
  markBtn.addEventListener("click", async () => {
    markBtn.disabled = true;
    if (marked_) {
      await Reads.unmarkRead(book.id);
      marked_ = false;
      markBtn.textContent = "♥ 标记为读过";
    } else {
      await Reads.markRead(book.id);
      marked_ = true;
      markBtn.textContent = "✓ 已标记读过";
      toast("已加入『我的』");
    }
    markBtn.disabled = false;
  });

  // 阅读进度条
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    const p = total > 0 ? (h.scrollTop / total) * 100 : 0;
    progress.style.width = p + "%";
  });

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 1600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
})();
