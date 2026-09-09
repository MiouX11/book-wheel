// 书籍数据（内联，支持本地文件直接打开）
window.BookData = (function () {
  const DATA = {"categories":[{"id":"finance","name":"金融投资","color":"#f59e0b","icon":"💰"},{"id":"growth","name":"励志人生","color":"#ef4444","icon":"🔥"},{"id":"cognition","name":"认知思维","color":"#3b82f6","icon":"🧠"},{"id":"energy","name":"精力管理","color":"#10b981","icon":"⚡"},{"id":"wealth","name":"财富观念","color":"#8b5cf6","icon":"💎"},{"id":"biography","name":"人物传记","color":"#ec4899","icon":"📖"},{"id":"philosophy","name":"哲学","color":"#6366f1","icon":"🏛️"},{"id":"psychoanalysis","name":"精神分析","color":"#a855f7","icon":"🌙"},{"id":"psychology","name":"心理学","color":"#14b8a6","icon":"💭"}],"books":[{"id":"poor-charlie-almanack","categoryId":"finance","title":"穷查理宝典","author":"查理·芒格","isbn10":"0578020939","readMinutes":12,"question":"芒格反复讲『反过来想，总是反过来想』。把你此刻最纠结的一个决定反过来问一遍——『怎么做能保证失败？』，答案是否比正着想更清晰？"},{"id":"intelligent-investor","categoryId":"finance","title":"聪明的投资者","author":"本杰明·格雷厄姆","isbn10":"0060555661","readMinutes":12,"question":"你上一次买入决定，究竟是基于价格还是基于价值？如果明天股价腰斩，你的判断会改变吗？"},{"id":"mans-search-for-meaning","categoryId":"growth","title":"活出生命的意义","author":"维克多·弗兰克尔","isbn10":"0807014273","readMinutes":12,"question":"如果人生的意义不是被『找到』而是被『选择』的，你今天愿意主动赋予正在做的事什么意义？"},{"id":"road-less-traveled","categoryId":"growth","title":"少有人走的路","author":"M·斯科特·派克","isbn10":"0743243153","readMinutes":12,"question":"你正在推迟的哪件事，其实推迟本身比做它更痛？为什么大脑仍旧选择推迟？"},{"id":"thinking-fast-and-slow","categoryId":"cognition","title":"思考，快与慢","author":"丹尼尔·卡尼曼","isbn10":"0374533555","readMinutes":12,"question":"回忆你最近一次凭直觉做的判断。如果强迫自己慢想 3 分钟，答案还会一样吗？"},{"id":"principles","categoryId":"cognition","title":"原则","author":"瑞·达利欧","isbn10":"1501124021","readMinutes":12,"question":"把你人生中最痛的三次失败写下来，能否从中提炼出一条『永不再犯』的原则？"},{"id":"power-of-full-engagement","categoryId":"energy","title":"精力管理","author":"吉姆·洛尔 & 托尼·施瓦茨","isbn10":"0743226755","readMinutes":12,"question":"你把时间管理做到极致，为什么还是精力枯竭？此刻透支的到底是『时间』还是『精力』？"},{"id":"deep-work","categoryId":"energy","title":"深度工作","author":"卡尔·纽波特","isbn10":"1455586692","readMinutes":12,"question":"过去 24 小时里，你有过一次超过 90 分钟完全不被打扰的深度思考吗？如果没有，代价是什么？"},{"id":"almanack-of-naval-ravikant","categoryId":"wealth","title":"纳瓦尔宝典","author":"埃里克·乔根森","isbn10":"1544514212","readMinutes":12,"question":"你目前积累的技能里，哪些能带来『睡后收入』？哪些只是在卖时间换钱？"},{"id":"psychology-of-money","categoryId":"wealth","title":"金钱心理学","author":"摩根·豪塞尔","isbn10":"0857197681","readMinutes":12,"question":"父母对钱的态度是如何塑造了你今天的花钱习惯？如果反过来做，你会失去什么，得到什么？"},{"id":"franklin-autobiography","categoryId":"biography","title":"富兰克林自传","author":"本杰明·富兰克林","isbn10":"0486290735","readMinutes":12,"question":"富兰克林 20 岁列出 13 项美德每日打卡。如果你现在只挑三条最难的写在自己的清单上，会是哪三条？"},{"id":"steve-jobs","categoryId":"biography","title":"史蒂夫·乔布斯传","author":"沃尔特·艾萨克森","isbn10":"1451648537","readMinutes":12,"question":"乔布斯的『现实扭曲力场』到底是天赋，还是危险的偏执？你身上有没有类似的东西？"},{"id":"meditations","categoryId":"philosophy","title":"沉思录","author":"马可·奥勒留","isbn10":"0812968255","readMinutes":12,"question":"如果每天早上都想一遍『今晚我可能不再醒来』，你现在纠结的这件事，还值得纠结吗？"},{"id":"myth-of-sisyphus","categoryId":"philosophy","title":"西西弗神话","author":"阿尔贝·加缪","isbn10":"0679733736","readMinutes":12,"question":"如果人生本无意义，你今天推的这块石头，为什么还愿意继续推？"},{"id":"art-of-loving","categoryId":"psychoanalysis","title":"爱的艺术","author":"埃里希·弗洛姆","isbn10":"0061129739","readMinutes":12,"question":"你说你爱一个人。你能否讲清楚——爱是一种感觉，是一种能力，还是一种承诺？"},{"id":"courage-to-be-disliked","categoryId":"psychoanalysis","title":"被讨厌的勇气","author":"岸见一郎 & 古贺史健","isbn10":"1501197274","readMinutes":12,"question":"你正在为谁的期待而活？如果他明天不再在乎你了，你今天的很多选择会变吗？"},{"id":"influence","categoryId":"psychology","title":"影响力","author":"罗伯特·西奥迪尼","isbn10":"006124189X","readMinutes":12,"question":"回想你最近一次冲动购买——是产品让你想买，还是场景让你想买？"},{"id":"flow","categoryId":"psychology","title":"心流","author":"米哈里·契克森米哈赖","isbn10":"0061339202","readMinutes":12,"question":"上一次你完全忘记时间、不觉得累的状态是在做什么？为什么现在的日常里没有这个？"},{"id":"a-random-walk-down-wall-street","categoryId":"finance","title":"漫步华尔街","author":"伯顿·马尔基尔","isbn10":"0393352242","readMinutes":12,"question":"如果你相信市场是有效的，为什么还在挑个股？指数基金持有了全世界，你为什么没有？"},{"id":"one-up-on-wall-street","categoryId":"finance","title":"彼得·林奇的成功投资","author":"彼得·林奇","isbn10":"0743200403","readMinutes":12,"question":"你身边最近出现的哪个产品让你觉得『这公司肯定赚钱』？你买它的股票了吗？为什么没买？"},{"id":"atomic-habits","categoryId":"growth","title":"原子习惯","author":"詹姆斯·克利尔","isbn10":"0735211299","readMinutes":12,"question":"你今天做了哪个『1% 的改进』？如果连续做 365 天，你会变成什么样的人？"},{"id":"mindset","categoryId":"growth","title":"终身成长","author":"卡罗尔·德韦克","isbn10":"0345472322","readMinutes":12,"question":"你最近一次失败后，内心的第一句话是『我不行』还是『我还没学会』？这两个词的差别就是你思维模式的分界线。"},{"id":"the-one-thing","categoryId":"cognition","title":"最重要的事，只有一件","author":"加里·凯勒 & 杰伊·帕帕桑","isbn10":"1885167776","readMinutes":12,"question":"如果你今天只能做一件事，哪件事做完后其他事都变容易或不必要了？你现在的时间花在这件事上了吗？"},{"id":"why-we-sleep","categoryId":"energy","title":"我们为什么睡觉","author":"马修·沃克","isbn10":"1501144316","readMinutes":12,"question":"你昨晚睡了几个小时？如果少于 7 小时，你的大脑现在已经相当于喝了酒——你还打算做重要决定吗？"},{"id":"the-millionaire-next-door","categoryId":"wealth","title":"邻家的百万富翁","author":"托马斯·斯坦利 & 威廉·丹科","isbn10":"1589795474","readMinutes":12,"question":"你开的车、穿的衣服、住的房——有多少是为了『看起来像成功人士』而不是真的需要？"},{"id":"shoe-dog","categoryId":"biography","title":"鞋狗","author":"菲尔·奈特","isbn10":"1501135929","readMinutes":12,"question":"菲尔·奈特创业前 8 年几乎没赚钱。如果你现在做的事 8 年都不赚钱，你还愿意继续吗？"},{"id":"letters-from-a-stoic","categoryId":"philosophy","title":"塞涅卡书信集","author":"塞涅卡","isbn10":"0143105825","readMinutes":12,"question":"你拥有的东西里，有多少是『你拥有的』，有多少是『拥有你的』？"},{"id":"the-ego-and-the-id","categoryId":"psychoanalysis","title":"自我与本我","author":"西格蒙德·弗洛伊德","isbn10":"0465016611","readMinutes":12,"question":"你最近一次莫名的情绪爆发——愤怒、嫉妒或恐惧——你有没有想过，那可能不是『你』在反应，而是你内心的另一个部分？"},{"id":"games-people-play","categoryId":"psychology","title":"人间游戏","author":"埃里克·伯恩","isbn10":"0345410033","readMinutes":12,"question":"你最近一次和别人吵架，表面上争的是什么事？暗地里你真正想要的是什么——被看见、被承认、还是赢？"},{"id":"hooked","categoryId":"cognition","title":"上瘾","author":"尼尔·埃亚尔","isbn10":"059341877X","readMinutes":12,"question":"你每天花时间最多的那个 App，它是怎么一步步让你『只是再看一眼』的？"}]};
  const distilledCache = {};

  async function loadAll() {
    return DATA;
  }

  async function getCategories() {
    const d = await loadAll();
    return d.categories;
  }

  async function getBooks() {
    const d = await loadAll();
    return d.books;
  }

  async function getBookById(id) {
    const d = await loadAll();
    return d.books.find((b) => b.id === id) || null;
  }

  async function getCategoryById(id) {
    const d = await loadAll();
    return d.categories.find((c) => c.id === id) || null;
  }

  async function getBooksByCategory(categoryId) {
    const d = await loadAll();
    return d.books.filter((b) => b.categoryId === categoryId);
  }

  async function pickRandomBook(categoryId) {
    const list = await getBooksByCategory(categoryId);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  async function getDistilled(bookId) {
    if (distilledCache[bookId]) return distilledCache[bookId];
    if (!window.DISTILLED_DATA || !window.DISTILLED_DATA[bookId]) {
      return "（正文加载失败：" + bookId + "）";
    }
    distilledCache[bookId] = window.DISTILLED_DATA[bookId];
    return distilledCache[bookId];
  }

  return {
    loadAll,
    getCategories,
    getBooks,
    getBookById,
    getCategoryById,
    getBooksByCategory,
    pickRandomBook,
    getDistilled,
  };
})();
