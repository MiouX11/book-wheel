// 我的：头像 + 昵称 + 我发过的感悟
(function () {
  const profileEl = document.getElementById("profile-card");
  const mineEl = document.getElementById("mine-reflect");
  if (!profileEl || !mineEl) return;

  const AVATAR_EDGE = 256;

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
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 1900);
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

  function avatarUrl(uid, bust) {
    const base = window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url;
    if (!base || !uid) return "";
    return base.replace(/\/$/, "") + "/storage/v1/object/public/avatars/" + uid + "/avatar.jpg" +
      (bust ? ("?v=" + bust) : "");
  }

  function meta() {
    const u = window.Auth && Auth.getUser();
    return (u && u.user_metadata) || {};
  }

  function initial(name) {
    const n = String(name || "").trim();
    return n ? n[0] : "书";
  }

  // 居中裁方形 + 压缩
  function toSquareJpeg(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const side = Math.min(w, h);
        const cv = document.createElement("canvas");
        cv.width = cv.height = AVATAR_EDGE;
        const ctx = cv.getContext("2d");
        ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, AVATAR_EDGE, AVATAR_EDGE);
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error("图片处理失败"))), "image/jpeg", 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("这张图读不出来")); };
      img.src = url;
    });
  }

  // ---------- 渲染 ----------
  let currentUser = null;
  let avatarBust = Date.now();

  function renderProfile() {
    const configured = window.Auth && Auth.isReady();
    if (!configured) {
      profileEl.innerHTML = `<div class="profile-empty">
        <p>账号服务还没接入，头像和昵称暂时不可用。</p></div>`;
      return;
    }
    if (!currentUser) {
      profileEl.innerHTML = `<div class="profile-empty">
        <p>登录后可以设置头像和昵称，发感悟时自动带上。</p>
        <a class="btn btn-primary btn-sm" href="login.html">去登录 / 注册</a></div>`;
      return;
    }
    const m = meta();
    const name = m.display_name || (currentUser.email || "").split("@")[0] || "书友";
    const url = avatarUrl(currentUser.id, m.avatar_updated_at || avatarBust);
    profileEl.innerHTML = `
      <div class="profile-inner">
        <div class="profile-avatar-wrap" id="avatar-wrap" title="点击更换头像">
          <span class="profile-avatar">
            ${url ? `<img src="${esc(url)}" alt="" onerror="this.remove()">` : ""}
            <span class="profile-avatar-init">${esc(initial(name))}</span>
          </span>
          <span class="profile-avatar-edit">更换</span>
          <input type="file" id="avatar-input" accept="image/*" hidden>
        </div>
        <div class="profile-fields">
          <label class="profile-field">
            <span>昵称</span>
            <input type="text" id="profile-name" maxlength="20" value="${esc(name)}">
          </label>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary btn-sm" id="profile-save">保存资料</button>
            <span class="profile-email">${esc(currentUser.email || "")}</span>
          </div>
        </div>
      </div>`;

    const wrap = document.getElementById("avatar-wrap");
    const input = document.getElementById("avatar-input");
    wrap.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const f = (input.files || [])[0];
      input.value = "";
      if (!f) return;
      toast("正在处理头像…");
      try {
        const blob = await toSquareJpeg(f);
        const path = currentUser.id + "/avatar.jpg";
        const { error } = await Auth.client().storage.from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (error) throw new Error("上传失败：" + error.message);
        const bust = Date.now();
        await Auth.client().auth.updateUser({ data: { avatar_updated_at: bust } });
        avatarBust = bust;
        renderProfile();
        toast("头像已更新");
      } catch (e) {
        toast(e.message || "头像上传失败");
      }
    });

    document.getElementById("profile-save").addEventListener("click", async () => {
      const val = document.getElementById("profile-name").value.trim().slice(0, 20);
      if (!val) { toast("昵称不能为空"); return; }
      try {
        await Auth.client().auth.updateUser({ data: { display_name: val } });
        toast("已保存");
        renderProfile();
      } catch (e) {
        toast(e.message || "保存失败");
      }
    });
  }

  function cardHtml(r, title) {
    const imgs = (r.image_urls || []).filter(Boolean);
    const uid = currentUser ? currentUser.id : "";
    const av = avatarUrl(r.user_id, (meta().avatar_updated_at || ""));
    const sameUser = r.user_id === uid;
    return `
      <article class="mine-card" data-id="${esc(r.id)}">
        <div class="mine-card-head">
          <span class="reflect-avatar">
            ${av && sameUser ? `<img src="${esc(av)}" alt="" onerror="this.remove()">` : ""}
            <span class="profile-avatar-init">${esc(initial(r.author_name))}</span>
          </span>
          <span class="reflect-author">${esc(r.author_name || "我")}</span>
          <span class="reflect-time">${esc(ago(r.created_at))}</span>
          <button type="button" class="reflect-del" data-id="${esc(r.id)}">删除</button>
        </div>
        ${r.content ? `<p class="reflect-body">${esc(r.content).replace(/\n/g, "<br>")}</p>` : ""}
        ${imgs.length ? `
          <div class="reflect-imgs reflect-imgs-${Math.min(imgs.length, 3)}">
            ${imgs.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="reflect-img"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join("")}
          </div>` : ""}
        <a class="comm-book" href="book.html?id=${encodeURIComponent(r.book_id)}">《${esc(title || r.book_id)}》</a>
      </article>
    `;
  }

  async function renderMine() {
    if (!currentUser) {
      mineEl.innerHTML = `<p class="reflect-empty">登录后，你发过的感悟都会收在这里。</p>`;
      return;
    }
    mineEl.innerHTML = `<p class="reflect-loading">加载中……</p>`;
    const [res, books] = await Promise.all([
      Reflections.list({ mine: true, limit: 50 }),
      BookData.getBooks().catch(() => []),
    ]);
    const titles = {};
    (books || []).forEach((b) => { titles[b.id] = b.title; });
    const items = res.items || [];
    if (items.length === 0) {
      mineEl.innerHTML = `<p class="reflect-empty">你还没发过感悟。<a href="library.html">去挑本书</a>，读完写两句。</p>`;
      return;
    }
    mineEl.innerHTML = items.map((r) => cardHtml(r, titles[r.book_id])).join("");
  }

  mineEl.addEventListener("click", async (e) => {
    const del = e.target.closest(".reflect-del");
    if (!del) return;
    if (!confirm("确定删除这条感悟吗？")) return;
    try {
      await Reflections.remove(del.dataset.id);
      del.closest(".mine-card").remove();
      toast("已删除");
    } catch (err) {
      toast(err.message || "删除失败");
    }
  });

  // Reflections.list 支持 mine
  async function boot() {
    await new Promise((resolve) => {
      if (!window.Auth || !Auth.isReady()) return resolve();
      let done = false;
      Auth.onChange(() => { if (!done) { done = true; resolve(); } });
      setTimeout(resolve, 900);
    });
    currentUser = window.Auth ? Auth.getUser() : null;
    renderProfile();
    renderMine();
  }

  window.Auth?.onChange((u) => {
    if (u === currentUser) return;
    currentUser = u;
    renderProfile();
    renderMine();
  });

  boot();
})();
