// 书详情页底部的「感悟」栏目：发布图文 + 浏览本书感悟
(function () {
  const mount = document.getElementById("reflect-mount");
  if (!mount) return;

  const params = new URLSearchParams(location.search);
  const bookId = params.get("id");
  if (!bookId) return;

  const PAGE = 5;
  let offset = 0;
  let bookTitle = "";
  let busy = false;
  let pending = [];        // 待发布的 File 列表

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 1900);
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

  mount.innerHTML = `
    <section class="reflect" id="reflect">
      <div class="reflect-head">
        <h2 class="reflect-title">感悟</h2>
        <p class="reflect-sub" id="reflect-sub">读完这本，你想说点什么？</p>
      </div>

      <form class="reflect-form" id="reflect-form" novalidate>
        <textarea id="reflect-text" class="reflect-text" rows="4"
          maxlength="1000" placeholder="写下你的感悟……（可直接发图）"></textarea>

        <div class="reflect-thumbs" id="reflect-thumbs"></div>

        <div class="reflect-bar">
          <label class="reflect-file">
            <input type="file" id="reflect-input" accept="image/*" multiple hidden>
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" style="flex-shrink:0">
              <path fill="currentColor" d="M9 3.5h6l1.3 2H19a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V8A2.5 2.5 0 0 1 5 5.5h2.7L9 3.5Zm3 4.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"/>
            </svg>
            <span>加图片</span>
          </label>
          <span class="reflect-name">
            署名
            <input type="text" id="reflect-name-input" maxlength="20" class="reflect-name-input">
          </span>
          <button type="submit" class="btn btn-primary btn-sm" id="reflect-submit">发布感悟</button>
        </div>
        <p class="reflect-tip" id="reflect-tip"></p>
      </form>

      <div class="reflect-list" id="reflect-list"></div>
      <button type="button" class="btn btn-ghost btn-sm reflect-more hidden" id="reflect-more">加载更多</button>
    </section>
  `;

  const form = document.getElementById("reflect-form");
  const textEl = document.getElementById("reflect-text");
  const thumbs = document.getElementById("reflect-thumbs");
  const input = document.getElementById("reflect-input");
  const nameInput = document.getElementById("reflect-name-input");
  const submitBtn = document.getElementById("reflect-submit");
  const listEl = document.getElementById("reflect-list");
  const moreBtn = document.getElementById("reflect-more");
  const subEl = document.getElementById("reflect-sub");
  const tipEl = document.getElementById("reflect-tip");

  nameInput.value = Reflections.displayName();

  function renderTip() {
    if (Reflections.mode() === "cloud") {
      tipEl.textContent = "";
      tipEl.classList.add("hidden");
    } else {
      tipEl.classList.remove("hidden");
      tipEl.innerHTML = '当前是本机模式：内容只存在这台设备上。<a href="login.html">登录</a>并按 README 接入 Supabase 后，所有人就都能看到了。';
    }
  }

  function renderThumbs() {
    thumbs.innerHTML = pending
      .map((f, i) => `
        <div class="reflect-thumb">
          <img src="${URL.createObjectURL(f)}" alt="">
          <button type="button" class="reflect-thumb-del" data-i="${i}" aria-label="移除">×</button>
        </div>
      `)
      .join("");
    thumbs.classList.toggle("hidden", pending.length === 0);
  }

  thumbs.addEventListener("click", (e) => {
    const btn = e.target.closest(".reflect-thumb-del");
    if (!btn) return;
    pending.splice(Number(btn.dataset.i), 1);
    renderThumbs();
  });

  input.addEventListener("change", () => {
    const picked = Array.from(input.files || []);
    input.value = "";
    const room = Reflections.MAX_IMAGES - pending.length;
    if (room <= 0) {
      toast("最多 " + Reflections.MAX_IMAGES + " 张图片");
      return;
    }
    if (picked.length > room) toast("最多 " + Reflections.MAX_IMAGES + " 张，已保留前 " + room + " 张");
    pending = pending.concat(picked.slice(0, room));
    renderThumbs();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const text = textEl.value.trim();
    if (!text && pending.length === 0) {
      toast("写点什么，或者加一张图");
      textEl.focus();
      return;
    }
    busy = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "发布中…";
    try {
      Reflections.setDisplayName(nameInput.value);
      await Reflections.add({ bookId: bookId, content: text, files: pending });
      textEl.value = "";
      pending = [];
      renderThumbs();
      offset = 0;
      await load(true);
      toast("已发布");
    } catch (err) {
      toast(err.message || "发布失败");
      if (String(err.message || "").indexOf("登录") >= 0) {
        setTimeout(() => { location.href = "login.html"; }, 900);
      }
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "发布感悟";
    }
  });

  function avatarImg(r) {
    const base = window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url;
    if (!base || !r.user_id || String(r.user_id) === "local") return "";
    const u = window.Auth && Auth.getUser();
    const bust = (u && u.user_metadata && u.user_metadata.avatar_updated_at) || "";
    return `<img class="avatar-img" loading="lazy" alt="" src="${esc(base.replace(/\/$/, ""))}/storage/v1/object/public/avatars/${esc(r.user_id)}/avatar.jpg${bust ? "?v=" + bust : ""}" onerror="this.remove()">`;
  }

  function cardHtml(r) {
    const imgs = (r.image_urls || []).filter(Boolean);
    const mine = Reflections.isMine(r);
    return `
      <article class="reflect-card" data-id="${esc(r.id)}">
        <div class="reflect-card-head">
          <span class="reflect-avatar">${avatarImg(r)}<span class="reflect-avatar-init">${esc(initial(r.author_name))}</span></span>
          <span class="reflect-author">${esc(r.author_name || "书友")}${r.author_code ? `<span class="author-code">@${esc(r.author_code)}</span>` : ""}</span>
          <span class="reflect-time">${esc(ago(r.created_at))}</span>
          ${mine ? '<button type="button" class="reflect-del" title="删除">删除</button>' : ""}
        </div>
        ${r.content ? `<p class="reflect-body">${esc(r.content).replace(/\n/g, "<br>")}</p>` : ""}
        ${imgs.length ? `
          <div class="reflect-imgs reflect-imgs-${Math.min(imgs.length, 3)}">
            ${imgs.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="reflect-img"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join("")}
          </div>` : ""}
      </article>
    `;
  }

  listEl.addEventListener("click", async (e) => {
    const del = e.target.closest(".reflect-del");
    if (!del) return;
    const card = del.closest(".reflect-card");
    if (!card) return;
    if (!confirm("确定删除这条感悟吗？")) return;
    try {
      await Reflections.remove(card.dataset.id);
      card.remove();
      toast("已删除");
    } catch (err) {
      toast(err.message || "删除失败");
    }
  });

  async function load(reset) {
    if (reset) {
      offset = 0;
      listEl.innerHTML = '<p class="reflect-loading">加载中……</p>';
    }
    const { items } = await Reflections.list({ bookId: bookId, limit: PAGE, offset: offset });
    if (reset) listEl.innerHTML = "";
    if (items.length === 0 && offset === 0) {
      listEl.innerHTML = '<p class="reflect-empty">还没有人写感悟。你可以是第一个。</p>';
      moreBtn.classList.add("hidden");
      return;
    }
    listEl.insertAdjacentHTML("beforeend", items.map(cardHtml).join(""));
    offset += items.length;
    moreBtn.classList.toggle("hidden", items.length < PAGE);
  }

  moreBtn.addEventListener("click", () => load(false));

  BookData.getBookById(bookId).then((b) => {
    if (b) {
      bookTitle = b.title;
      textEl.placeholder = "读完《" + bookTitle + "》，你想说点什么？";
      subEl.textContent = "《" + bookTitle + "》的读者感悟";
    }
  });

  renderTip();
  renderThumbs();
  load(true);

  window.Auth?.onChange(() => {
    renderTip();
    if (Reflections.mode() === "cloud") load(true);
  });
})();
