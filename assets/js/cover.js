// 封面渲染：先出彩色占位，再异步尝试多源真图，失败保持占位
window.Cover = (function () {
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function html(book, category, opts) {
    opts = opts || {};
    const cls = opts.mini ? "cover cover-mini" : "cover";
    const first = escape((book.title || "书")[0]);
    return `
      <div class="${cls}" data-book-id="${escape(book.id)}"
           style="background:linear-gradient(135deg, ${category.color}, ${category.color}dd)">
        <span class="cover-char">${first}</span>
      </div>
    `;
  }

  function sources(book) {
    const out = [`assets/covers/${book.id}.jpg`];
    if (book.isbn10) {
      out.push(`https://images-na.ssl-images-amazon.com/images/P/${book.isbn10}.01.LZZZZZZZ.jpg`);
    }
    return out;
  }

  function tryLoad(wrap, urls, i) {
    if (i >= urls.length) return; // 保留占位
    const probe = new Image();
    probe.onload = () => {
      // Amazon 缺书时返回 1x1 占位图
      if (probe.naturalWidth <= 10 || probe.naturalHeight <= 10) {
        tryLoad(wrap, urls, i + 1);
        return;
      }
      const el = document.createElement("img");
      el.src = probe.src;
      el.className = "cover-img";
      el.alt = "";
      el.loading = "lazy";
      const ch = wrap.querySelector(".cover-char");
      if (ch) ch.style.display = "none";
      wrap.appendChild(el);
      wrap.classList.add("has-img");
    };
    probe.onerror = () => tryLoad(wrap, urls, i + 1);
    probe.referrerPolicy = "no-referrer";
    probe.src = urls[i];
  }

  async function upgradeAll(root) {
    root = root || document;
    const nodes = root.querySelectorAll(".cover[data-book-id]:not([data-upgraded])");
    for (const wrap of nodes) {
      wrap.setAttribute("data-upgraded", "1");
      const bookId = wrap.dataset.bookId;
      const book = await BookData.getBookById(bookId);
      if (!book) continue;
      tryLoad(wrap, sources(book), 0);
    }
  }

  return { html, upgradeAll };
})();
