// 感悟：读者发布的图文
// 双模式：
//   - 已配置 Supabase 且已登录  -> 云端（所有人可见，图片进 Storage）
//   - 未配置 / 未登录           -> 本地兜底（localStorage，仅本机可见）
// 图片一律先在前端压缩到最长边 1280px 再上传，避免动辄几 MB 的原图。
window.Reflections = (function () {
  const LS_KEY = "book-wheel:reflections";
  const NAME_KEY = "book-wheel:author-name";
  const LS_LIMIT = 40;              // 本地模式最多保留条数，防止 localStorage 撑爆
  const BUCKET = "reflections";
  const MAX_IMAGES = 3;
  const MAX_EDGE = 1280;
  const MAX_TEXT = 1000;

  function supa() {
    return window.Auth && Auth.isReady() ? Auth.client() : null;
  }
  function user() {
    return window.Auth && Auth.isReady() ? Auth.getUser() : null;
  }
  function mode() {
    return supa() ? "cloud" : "local";
  }

  // ---------- 本地兜底 ----------
  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function writeLocal(arr) {
    const trimmed = arr.slice(0, LS_LIMIT);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      throw new Error("本地空间已满。请先删掉几条旧感悟，或按 README 接入 Supabase 开启云端存储。");
    }
  }

  // ---------- 署名 ----------
  function defaultName() {
    const u = user();
    return u && u.email ? String(u.email).split("@")[0] : "书友";
  }
  function displayName() {
    return localStorage.getItem(NAME_KEY) || defaultName();
  }
  function setDisplayName(n) {
    const v = String(n || "").trim().slice(0, 20);
    if (v) localStorage.setItem(NAME_KEY, v);
    return displayName();
  }

  // ---------- 图片 ----------
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        cv.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("图片处理失败"))),
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("这张图读不出来，换一张试试"));
      };
      img.src = url;
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error("图片读取失败"));
      fr.readAsDataURL(blob);
    });
  }

  async function uploadToStorage(blob, uid, idx) {
    const path = uid + "/" + Date.now() + "-" + idx + ".jpg";
    const { error } = await supa()
      .storage.from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error("图片上传失败：" + error.message);
    const { data } = supa().storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  // ---------- 增 / 查 / 删 ----------
  async function add(opts) {
    const bookId = opts.bookId;
    const content = String(opts.content || "").trim().slice(0, MAX_TEXT);
    const files = Array.from(opts.files || []).slice(0, MAX_IMAGES);

    if (!bookId) throw new Error("缺少书籍 ID");
    if (!content && files.length === 0) throw new Error("写点什么，或者加一张图");

    const name = displayName();
    const urls = [];

    if (supa()) {
      const u = user();
      if (!u) throw new Error("请先登录再发布");
      for (let i = 0; i < files.length; i++) {
        const blob = await compressImage(files[i]);
        urls.push(await uploadToStorage(blob, u.id, i));
      }
      const { data, error } = await supa()
        .from("reflections")
        .insert({
          user_id: u.id,
          author_name: name,
          book_id: bookId,
          content: content,
          image_urls: urls,
        })
        .select()
        .single();
      if (error) throw new Error("发布失败：" + error.message);
      return data;
    }

    // 本地兜底
    for (const f of files) {
      const blob = await compressImage(f);
      urls.push(await blobToDataURL(blob));
    }
    const rec = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      user_id: "local",
      author_name: name,
      book_id: bookId,
      content: content,
      image_urls: urls,
      created_at: new Date().toISOString(),
    };
    const arr = readLocal();
    arr.unshift(rec);
    writeLocal(arr);
    return rec;
  }

  async function list(opts) {
    opts = opts || {};
    const bookId = opts.bookId || null;
    const limit = opts.limit || 9;
    const offset = opts.offset || 0;

    if (supa()) {
      let q = supa()
        .from("reflections")
        .select("id, user_id, author_name, book_id, content, image_urls, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (bookId) q = q.eq("book_id", bookId);
      const { data, error } = await q;
      if (!error && data) return { items: data, mode: "cloud" };
      console.warn("云端感悟读取失败，回落本地", error);
    }

    let arr = readLocal();
    if (bookId) arr = arr.filter((r) => r.book_id === bookId);
    return { items: arr.slice(offset, offset + limit), mode: "local" };
  }

  async function remove(id) {
    if (supa() && !String(id).startsWith("local-")) {
      const { error } = await supa().from("reflections").delete().eq("id", id);
      if (error) throw new Error("删除失败：" + error.message);
      return;
    }
    writeLocal(readLocal().filter((r) => r.id !== id));
  }

  function isMine(rec) {
    if (supa()) {
      const u = user();
      return !!(u && rec && rec.user_id === u.id);
    }
    return !!(rec && String(rec.user_id) === "local");
  }

  return {
    mode,
    add,
    list,
    remove,
    isMine,
    displayName,
    setDisplayName,
    compressImage,
    MAX_IMAGES,
    MAX_TEXT,
  };
})();
