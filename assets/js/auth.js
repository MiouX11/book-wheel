// Supabase 认证封装
// 未配置 supabase-config.js 时，isReady() 为 false，其他方法自动 no-op
window.Auth = (function () {
  let client = null;
  let currentUser = null;
  let ready = false;
  const listeners = [];

  function notify() {
    listeners.forEach((fn) => {
      try { fn(currentUser); } catch (e) { console.error(e); }
    });
  }

  function init() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return; // 未配置，静默降级
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("Supabase JS 未加载（检查 CDN 引用）");
      return;
    }
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    ready = true;
    // 恢复既有会话
    client.auth.getSession().then(({ data }) => {
      currentUser = data?.session?.user || null;
      notify();
    });
    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      notify();
    });
  }

  async function signUp(email, password) {
    if (!ready) throw new Error("尚未配置 Supabase（见 README）");
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    if (!ready) throw new Error("尚未配置 Supabase（见 README）");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!ready) return;
    await client.auth.signOut();
  }

  init();

  return {
    isReady: () => ready,
    isConfigured: () => ready,
    client: () => client,
    getUser: () => currentUser,
    onChange: (fn) => { listeners.push(fn); fn(currentUser); },
    signUp,
    signIn,
    signOut,
  };
})();
