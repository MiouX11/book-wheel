// 读过的书 - 本地/云端双写
// - 未登录：localStorage
// - 已登录：Supabase，同时写一份本地作为离线兜底
window.Reads = (function () {
  const KEY = "book-wheel:reads";

  function getLocal() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch { return []; }
  }
  function setLocal(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }
  function localAdd(bookId) {
    const arr = getLocal();
    if (arr.some((r) => r.book_id === bookId)) return;
    arr.push({ book_id: bookId, created_at: new Date().toISOString() });
    setLocal(arr);
  }
  function localRemove(bookId) {
    setLocal(getLocal().filter((r) => r.book_id !== bookId));
  }

  function loggedIn() {
    return window.Auth && Auth.isReady() && Auth.getUser();
  }

  async function list() {
    if (loggedIn()) {
      const { data, error } = await Auth.client()
        .from("reads")
        .select("book_id, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
      console.warn("云端 reads 读取失败，回落本地", error);
    }
    return getLocal().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  async function markRead(bookId) {
    localAdd(bookId);
    if (loggedIn()) {
      const user = Auth.getUser();
      const { error } = await Auth.client()
        .from("reads")
        .upsert(
          { user_id: user.id, book_id: bookId },
          { onConflict: "user_id,book_id" }
        );
      if (error) console.warn("云端标记失败，本地已存", error);
    }
  }

  async function unmarkRead(bookId) {
    localRemove(bookId);
    if (loggedIn()) {
      const { error } = await Auth.client()
        .from("reads")
        .delete()
        .eq("book_id", bookId);
      if (error) console.warn("云端取消失败", error);
    }
  }

  async function has(bookId) {
    const arr = await list();
    return arr.some((r) => r.book_id === bookId);
  }

  // 登录后：把本地记录并入云端（登录页调用一次）
  async function syncLocalToCloud() {
    if (!loggedIn()) return { pushed: 0 };
    const local = getLocal();
    if (local.length === 0) return { pushed: 0 };
    const user = Auth.getUser();
    const rows = local.map((r) => ({
      user_id: user.id,
      book_id: r.book_id,
      created_at: r.created_at,
    }));
    const { error } = await Auth.client()
      .from("reads")
      .upsert(rows, { onConflict: "user_id,book_id" });
    if (error) {
      console.warn("同步本地到云端失败", error);
      return { pushed: 0, error };
    }
    return { pushed: rows.length };
  }

  return { list, markRead, unmarkRead, has, syncLocalToCloud };
})();
