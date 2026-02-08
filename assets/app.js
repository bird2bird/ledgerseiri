(function () {
  const DEFAULT_LANG = "ja";

  // =======================
  // i18n dictionary（你原来的 그대로）
  // =======================
  const dict = {
    ja: {
      nav_features: "機能",
      nav_solution: "解決できること",
      nav_pricing: "料金",
      nav_flow: "導入の流れ",
      nav_faq: "FAQ",
      nav_commerce: "特定商取引法に基づく表記",
      nav_disclosure: "商業披露",

      cta_contact: "お問い合わせ",
      cta_disclosure: "商業披露",
      cta_download: "資料をダウンロード",
      cta_view_commerce: "特定商取引法に基づく表記",

      hero_kicker: "クロスボーダーEC向け / 売上・手数料・費用の整理に特化",
      hero_h1: "帳簿データを、\n迷わず整理する。",
      hero_p:
        "LedgerSeiriは、売上・手数料・費用データの整理・集計・分類を支援するクラウド型ソフトウェア（SaaS）です。\n資金の保管、決済代行、税務代理業務は行いません。",

      hero_btn_primary: "資料をダウンロード",
      hero_btn_secondary: "特定商取引法に基づく表記",

      badge_1_a: "入力工数を",
      badge_1_b: "最小化",
      badge_2_a: "出力は",
      badge_2_b: "CSV/Excel",
      badge_3_a: "Stripe審査用",
      badge_3_b: "表記を整備",

      sec_features_h2: "主要機能",
      sec_features_sub:
        "“会計ソフトの前段”で、まずデータを整える。月次のズレや抜け漏れを早期に潰します。",
      f1_t: "売上・手数料・費用を自動で整形",
      f1_p: "Amazon等の明細を、見やすい形へ整理。科目・区分の土台を作ります。",
      f2_t: "集計（チャネル/商品/期間）",
      f2_p: "月次/チャネル/ASINなどの軸で集計し、数字の違和感を早期発見。",
      f3_t: "CSV/Excel 出力（税理士・会計ツール向け）",
      f3_p: "“そのまま渡せる”出力を想定。後工程の手戻りを減らします。",

      sec_solution_h2: "よくある課題を、こう解決します",
      sec_solution_sub:
        "「Amazonの売上表示が合わない」「手数料が複雑」「返品/返金が混ざる」など、現場の悩みに寄せた設計です。",
      sol_left_h: "課題（現場）",
      sol_right_h: "LedgerSeiriの対応",
      sol_1_b: "明細が複雑で、どれが売上/手数料かわからない",
      sol_1_s: "項目を整理し、用途別に分類しやすい形へ整形",
      sol_2_b: "返品/返金が混ざって月次がズレる",
      sol_2_s: "返金関連を分離し、集計軸で差分を見える化",
      sol_3_b: "税理士へ渡す前に、毎月の整形作業が重い",
      sol_3_s: "CSV/Excel出力で引き渡しを標準化",

      sec_pricing_h2: "料金（消費税込）",
      pricing_note: "※ 価格は暫定です。正式公開前に変更となる場合があります。",
      p1_t: "Starter",
      p1_y: "¥1,980/月",
      p2_t: "Standard",
      p2_y: "¥4,980/月",
      p3_t: "Business",
      p3_y: "¥9,980/月",
      p_ribbon: "人気",
      p_common_1: "基本の整理・分類",
      p_common_2: "CSV/Excel 出力",
      p_common_3: "メールサポート",
      p_std_1: "集計（チャネル/商品）",
      p_std_2: "出力テンプレート拡張",
      p_std_3: "優先サポート",
      p_bus_1: "チーム利用（複数ユーザー）",
      p_bus_2: "高度な分類ルール",
      p_bus_3: "導入相談",

      sec_flow_h2: "導入の流れ",
      sec_flow_sub: "最短で「毎月回る形」まで持っていく想定です。",
      flow_1_b: "1) データを用意",
      flow_1_s: "Amazon等のCSV/Excelをエクスポート",
      flow_2_b: "2) 整理・分類",
      flow_2_s: "売上/手数料/費用を整形し、ルール化",
      flow_3_b: "3) 出力して共有",
      flow_3_s: "税理士/会計ツール向けにCSV/Excelで提出",

      sec_voice_h2: "想定ユーザーの声（例）",
      q_1: "「月次の数字が合わない原因が、どこかで止まっていた」",
      q_1_w: "Amazon販売（個人/小規模）",
      q_2: "「返品・返金を分けて見える化すると、焦りが減った」",
      q_2_w: "越境EC（複数チャネル）",
      q_3: "「税理士に渡す前の整形が、毎月のボトルネックだった」",
      q_3_w: "小規模法人（バックオフィス）",

      sec_faq_h2: "よくある質問",
      faq1_q: "LedgerSeiriは会計ソフトですか？",
      faq1_a:
        "会計データの整理・集計・分類を支援するツールです。会計帳簿の作成や税務代理は行いません。",
      faq2_q: "カード情報は保存しますか？",
      faq2_a:
        "保存しません。決済はStripe等の決済事業者側で処理する想定です。",
      faq3_q: "Stripe審査向けのページはありますか？",
      faq3_a:
        "あります。メニューの「特定商取引法に基づく表記 / 商業披露」からご確認ください。",

      band_h2: "Stripe審査に必要な表記を、先に整える。",
      band_p:
        "特定商取引法表記 / 返金・解約方針 / 連絡先など、決済審査で問われやすい情報を整理しています。",
      band_btn_1: "特定商取引法に基づく表記",
      band_btn_2: "商業披露へ",

      footer_company: "運営会社",
      footer_contact: "お問い合わせ",
      footer_legal: "特定商取引法に基づく表記",
      footer_disclosure: "商業披露",
      footer_copy: "© 2026 LedgerSeiri",

      commerce_h1: "特定商取引法に基づく表記",
      commerce_lead:
        "本ページは、通信販売に関する表示事項を掲載しています。LedgerSeiriは会計データ（売上・手数料・費用等）の整理・集計・分類を支援するソフトウェア（SaaS）であり、資金の保管、決済代行、税務代理業務は行いません。",
      commerce_disclosure_h2: "商業披露（Commerce Disclosure）",
      commerce_disclosure_p:
        "本ページは、決済事業者・プラットフォームの審査で求められる「商業披露」要件を満たすための情報を含みます。表示内容は予告なく更新される場合があります。",
      commerce_back: "← Home",
    },
  };

  function getLang() {
    const stored = localStorage.getItem("ls_lang");
    return stored && dict[stored] ? stored : DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!dict[lang]) lang = DEFAULT_LANG;
    localStorage.setItem("ls_lang", lang);
    applyLang(lang);
    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
    });
  }

  function applyLang(lang) {
    const d = dict[lang] || dict[DEFAULT_LANG];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = d[key];
      if (val === undefined) return;

      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.placeholder = val;
      else el.textContent = val;
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      const key = titleEl.getAttribute("data-i18n");
      if (d[key]) titleEl.textContent = d[key];
    }

    document.documentElement.setAttribute("lang", lang);
  }

  // Drawer
  function setupDrawer() {
    const btn = document.querySelector("[data-drawer-open]");
    const overlay = document.querySelector("[data-drawer-overlay]");
    const drawer = document.querySelector("[data-drawer]");
    const closeBtn = document.querySelector("[data-drawer-close]");
    if (!btn || !overlay || !drawer) return;

    function open() {
      overlay.classList.add("open");
      drawer.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      overlay.classList.remove("open");
      drawer.classList.remove("open");
      document.body.style.overflow = "";
    }

    btn.addEventListener("click", open);
    overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  // Dashboard mock + subtle animation
  function setupDashboardMock() {
    const root = document.querySelector("[data-dashboard]");
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll("[data-dash-tab]"));
    const kpiEls = {
      sales: root.querySelector('[data-dash-kpi="sales"]'),
      fee: root.querySelector('[data-dash-kpi="fee"]'),
      profit: root.querySelector('[data-dash-kpi="profit"]'),
    };
    const rowLeftEls = Array.from(root.querySelectorAll("[data-dash-row-left]"));
    const rowBadgeEls = Array.from(root.querySelectorAll("[data-dash-row-badge]"));

    const views = {
      month: {
        kpis: { sales: "¥2,790,080", fee: "¥-412,300", profit: "¥1,103,500" },
        rows: [
          { left: "Amazon 手数料", badge: "整形済み" },
          { left: "広告費（SP/SD）", badge: "集計" },
          { left: "返金/返品", badge: "分類" },
          { left: "税理士向け出力", badge: "CSV/Excel" },
        ],
      },
      channel: {
        kpis: { sales: "¥1,842,000", fee: "¥-298,500", profit: "¥742,400" },
        rows: [
          { left: "Amazon（JP）", badge: "集計" },
          { left: "楽天", badge: "集計" },
          { left: "Shopify", badge: "整形済み" },
          { left: "チャネル別出力", badge: "CSV/Excel" },
        ],
      },
      product: {
        kpis: { sales: "¥980,600", fee: "¥-158,900", profit: "¥401,200" },
        rows: [
          { left: "ASIN: B0XXXX（例）", badge: "分類" },
          { left: "ASIN: B0YYYY（例）", badge: "分類" },
          { left: "返品影響（商品別）", badge: "集計" },
          { left: "商品別出力", badge: "CSV/Excel" },
        ],
      },
    };

    function animateBlock() {
      // whole block subtle fade up
      root.classList.remove("dash-anim");
      void root.offsetWidth; // reflow
      root.classList.add("dash-anim");

      // numbers subtle
      Object.values(kpiEls).forEach((el) => {
        if (!el) return;
        el.classList.remove("dash-num-anim");
        void el.offsetWidth;
        el.classList.add("dash-num-anim");
      });
    }

    function apply(viewKey) {
      const view = views[viewKey] || views.month;

      tabs.forEach((btn) => {
        const key = btn.getAttribute("data-dash-tab");
        btn.classList.toggle("is-active", key === viewKey);
        btn.setAttribute("aria-selected", key === viewKey ? "true" : "false");
      });

      if (kpiEls.sales) kpiEls.sales.textContent = view.kpis.sales;
      if (kpiEls.fee) kpiEls.fee.textContent = view.kpis.fee;
      if (kpiEls.profit) kpiEls.profit.textContent = view.kpis.profit;

      for (let i = 0; i < 4; i++) {
        if (rowLeftEls[i]) rowLeftEls[i].textContent = view.rows[i]?.left || "";
        if (rowBadgeEls[i]) rowBadgeEls[i].textContent = view.rows[i]?.badge || "";
      }

      animateBlock();
    }

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => apply(btn.getAttribute("data-dash-tab") || "month"));
    });

    apply("month");
  }

  // Contact form -> mailto (cannot auto-send without backend)
  function setupContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]')?.value?.trim() || "";
      const email = form.querySelector('[name="email"]')?.value?.trim() || "";
      const subjectUser = form.querySelector('[name="subject"]')?.value?.trim() || "";
      const message = form.querySelector('[name="message"]')?.value?.trim() || "";

      const to = "bird2bird2024@gmail.com";
      const subject = `【LedgerSeiri お問い合わせ】${subjectUser || "（件名なし）"}`;
      const body =
        `お名前：${name}\n` +
        `メール：${email}\n` +
        `件名：${subjectUser}\n\n` +
        `内容：\n${message}\n\n` +
        `----\n送信元：/contact (static)\n`;

      // opens default mail client
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  // Login/Register demo (localStorage only; NOT secure)
  function setupAuth() {
    const root = document.querySelector("[data-auth]");
    if (!root) return;

    const tabLogin = root.querySelector('[data-auth-tab="login"]');
    const tabRegister = root.querySelector('[data-auth-tab="register"]');
    const panelLogin = root.querySelector('[data-auth-panel="login"]');
    const panelRegister = root.querySelector('[data-auth-panel="register"]');
    const status = root.querySelector("[data-auth-status]");

    function show(mode) {
      const isLogin = mode === "login";
      tabLogin.classList.toggle("is-active", isLogin);
      tabRegister.classList.toggle("is-active", !isLogin);
      panelLogin.style.display = isLogin ? "block" : "none";
      panelRegister.style.display = !isLogin ? "block" : "none";
    }

    function getUser() {
      try { return JSON.parse(localStorage.getItem("ls_user") || "null"); }
      catch { return null; }
    }

    function setStatus(msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.style.color = ok ? "var(--success)" : "var(--muted)";
    }

    tabLogin?.addEventListener("click", () => show("login"));
    tabRegister?.addEventListener("click", () => show("register"));
    show("login");

    // register
    const regForm = root.querySelector("[data-register-form]");
    regForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = regForm.querySelector('[name="reg_email"]')?.value?.trim() || "";
      const pass = regForm.querySelector('[name="reg_password"]')?.value || "";
      const pass2 = regForm.querySelector('[name="reg_password2"]')?.value || "";

      if (!email || !pass) return setStatus("メールとパスワードを入力してください。", false);
      if (pass.length < 6) return setStatus("パスワードは6文字以上にしてください。", false);
      if (pass !== pass2) return setStatus("パスワードが一致しません。", false);

      localStorage.setItem("ls_user", JSON.stringify({ email, pass }));
      setStatus("登録しました。ログインしてください。", true);
      show("login");
    });

    // login
    const loginForm = root.querySelector("[data-login-form]");
    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="login_email"]')?.value?.trim() || "";
      const pass = loginForm.querySelector('[name="login_password"]')?.value || "";
      const user = getUser();

      if (!user) return setStatus("ユーザーが未登録です。先に登録してください。", false);
      if (user.email === email && user.pass === pass) {
        localStorage.setItem("ls_session", JSON.stringify({ email, at: Date.now() }));
        setStatus("ログイン成功（デモ）", true);
        // demo redirect
        setTimeout(() => (window.location.href = "/"), 500);
      } else {
        setStatus("メールまたはパスワードが正しくありません。", false);
      }
    });

    // show current session
    try {
      const sess = JSON.parse(localStorage.getItem("ls_session") || "null");
      if (sess?.email) setStatus(`ログイン中（デモ）：${sess.email}`, true);
    } catch {}
  }

  function init() {
    const lang = getLang();
    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
      sel.addEventListener("change", (e) => setLang(e.target.value));
    });

    applyLang(lang);
    setupDrawer();
    setupDashboardMock();
    setupContactForm();
    setupAuth();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
