// 书库：列出所有书，可搜索、可按类别过滤，点击进 book.html
(async function () {
  const searchInput = document.getElementById("search-input");
  const catFilterEl = document.getElementById("cat-filter");
  const gridEl = document.getElementById("library-grid");
  const emptyEl = document.getElementById("library-empty");
  const countEl = document.getElementById("library-count");

  let categories = [];
  let books = [];
  let readSet = new Set();
  let activeCat = "all";
  let keyword = "";

  try {
    [categories, books] = await Promise.all([
      BookData.getCategories(),
      BookData.getBooks(),
    ]);
  } catch (e) {
    gridEl.innerHTML = `<p class="empty">书目加载失败：${e.message}</p>`;
    return;
  }

  // 已读列表（云端或本地）
  try {
    const reads = await Reads.list();
    readSet = new Set(reads.map((r) => r.book_id));
  } catch (_) {}

  // 类别筛选按钮
  catFilterEl.innerHTML =
    `<button class="cat-tab active" data-cat="all">全部 <span class="cnt">${books.length}</span></button>` +
    categories
      .map((c) => {
        const n = books.filter((b) => b.categoryId === c.id).length;
        return `<button class="cat-tab" data-cat="${c.id}"
          style="--tab-color:${c.color}">
          ${c.icon} ${escape(c.name)} <span class="cnt">${n}</span>
        </button>`;
      })
      .join("");

  catFilterEl.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".cat-tab");
    if (!tab) return;
    activeCat = tab.dataset.cat;
    catFilterEl.querySelectorAll(".cat-tab").forEach((t) => t.classList.toggle("active", t === tab));
    render();
  });

  searchInput.addEventListener("input", () => {
    keyword = searchInput.value.trim().toLowerCase();
    render();
  });

  function render() {
    const catById = new Map(categories.map((c) => [c.id, c]));
    let filtered = books.slice();
    if (activeCat !== "all") {
      filtered = filtered.filter((b) => b.categoryId === activeCat);
    }
    if (keyword) {
      filtered = filtered.filter((b) => {
        const cat = catById.get(b.categoryId);
        return (
          b.title.toLowerCase().includes(keyword) ||
          (b.author || "").toLowerCase().includes(keyword) ||
          (cat && cat.name.toLowerCase().includes(keyword)) ||
          (b.question || "").toLowerCase().includes(keyword)
        );
      });
    }

    countEl.textContent = keyword || activeCat !== "all"
      ? `匹配 ${filtered.length} / ${books.length} 本`
      : `共 ${books.length} 本`;

    if (!filtered.length) {
      gridEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    gridEl.innerHTML = filtered
      .map((b) => {
        const cat = catById.get(b.categoryId);
        const read = readSet.has(b.id);
        return `
          <a class="lib-card${read ? " is-read" : ""}" href="book.html?id=${encodeURIComponent(b.id)}">
            ${Cover.html(b, cat)}
            <div class="lib-card-body">
              <div class="lib-card-tag" style="background:${cat.color}22;color:${cat.color}">
                ${cat.icon} ${escape(cat.name)}
              </div>
              <div class="lib-card-title">《${escape(b.title)}》</div>
              <div class="lib-card-author">${escape(b.author)}</div>
              ${read ? '<div class="lib-card-read">✓ 已读过</div>' : ""}
            </div>
          </a>
        `;
      })
      .join("");

    Cover.upgradeAll(gridEl);
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  render();
})();
