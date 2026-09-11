// 首页「社区」板块：汇聚所有书下的读者感悟
(function () {
  const grid = document.getElementById("community-grid");
  if (!grid) return;

  const PAGE = 9;
  let offset = 0;
  let titles = {};
  let busy = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function ago(iso) {
    const t = new Date(iso).getTime();
    if (!t) return "";
    const d = Math.floor((Date.now() - t) / 1000);
    if (d < 60) return "刚刚";
    if (d < 3600) return Math.floor(d / 60) + " 分钟前";
    if (d < 86400) return Math.floor(d / 3600) + " 小时前";
    if (d < 86400 * 30) return Math.floor(d / 86400) + " 天前";
    const dt = new Date(t);
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") +
      "-" + String(dt.getDate()).padStart(2, "0");
  }

  function initial(name) {
    const n = String(name || "书").trim();
    return n ? n[0] : "书";
  }

  function cardHtml(r) {
    const imgs = (r.image_urls || []).filter(Boolean);
    const title = titles[r.book_id] || r.book_id;
    return `
      <article class="comm-card">
        <div class="comm-head">
          <span class="comm-avatar">${esc(initial(r.author_name))}</span>
          <span class="comm-author">${esc(r.author_name || "书友")}</span>
          <span class="comm-time">${esc(ago(r.created_at))}</span>
        </div>
        ${r.content ? `<p class="comm-body">${esc(r.content).replace(/\n/g, "<br>")}</p>` : ""}
        ${imgs.length ? `
          <div class="comm-imgs comm-imgs-${Math.min(imgs.length, 3)}">
            ${imgs.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="comm-img"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join("")}
          </div>` : ""}
        <a class="comm-book" href="book.html?id=${encodeURIComponent(r.book_id)}">《${esc(title)}》</a>
      </article>
    `;
  }

  async function load(reset) {
    if (busy) return;
    busy = true;
    if (reset) {
      offset = 0;
      grid.innerHTML = '<p class="comm-loading">加载中……</p>';
    }
    const moreBtn = document.getElementById("community-more");
    try {
      const { items, mode } = await Reflections.list({ limit: PAGE, offset: offset });
      if (reset) grid.innerHTML = "";
      if (items.length === 0 && offset === 0) {
        grid.innerHTML = `<div class="comm-empty">
          <p>还没有人写感悟。</p>
          <p class="comm-empty-sub">${mode === "local"
            ? "你是第一个。去书库随便挑一本，读完在下面写两句。"
            : "去书库随便挑一本，读完在下面写两句，这里就会出现。"}</p>
          <a class="btn btn-primary btn-sm" href="library.html">去书库看看</a>
        </div>`;
        if (moreBtn) moreBtn.classList.add("hidden");
        return;
      }
      grid.insertAdjacentHTML("beforeend", items.map(cardHtml).join(""));
      offset += items.length;
      if (moreBtn) moreBtn.classList.toggle("hidden", items.length < PAGE);

      const hint = document.getElementById("community-hint");
      if (hint && mode === "local") hint.classList.remove("hidden");
    } catch (e) {
      console.warn(e);
      if (reset) grid.innerHTML = '<p class="comm-empty">加载失败，稍后再试。</p>';
    } finally {
      busy = false;
    }
  }

  const moreBtn = document.getElementById("community-more");
  if (moreBtn) moreBtn.addEventListener("click", () => load(false));

  (async function init() {
    try {
      const books = await BookData.getBooks();
      books.forEach((b) => { titles[b.id] = b.title; });
    } catch (e) { /* 书名取不到就退化显示 id */ }
    await load(true);
  })();

  window.Auth?.onChange(() => {
    if (Reflections.mode() === "cloud") load(true);
  });
})();
