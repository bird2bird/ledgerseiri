(function () {
  const DEFAULT_LANG = "ja";

  // =======================
  // i18n dictionary
  // =======================
  const dict = {
    ja: {
      // nav
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

      // hero
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

      // sections
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

      // CTA band
      band_h2: "Stripe審査に必要な表記を、先に整える。",
      band_p:
        "特定商取引法表記 / 返金・解約方針 / 連絡先など、決済審査で問われやすい情報を整理しています。",
      band_btn_1: "特定商取引法に基づく表記",
      band_btn_2: "商業披露へ",

      // footer
      footer_company: "運営会社",
      footer_contact: "お問い合わせ",
      footer_legal: "特定商取引法に基づく表記",
      footer_disclosure: "商業披露",
      footer_copy: "© 2026 LedgerSeiri",

      // commerce page
      commerce_h1: "特定商取引法に基づく表記",
      commerce_lead:
        "本ページは、通信販売に関する表示事項を掲載しています。LedgerSeiriは会計データ（売上・手数料・費用等）の整理・集計・分類を支援するソフトウェア（SaaS）であり、資金の保管、決済代行、税務代理業務は行いません。",
      commerce_disclosure_h2: "商業披露（Commerce Disclosure）",
      commerce_disclosure_p:
        "本ページは、決済事業者・プラットフォームの審査で求められる「商業披露」要件を満たすための情報を含みます。表示内容は予告なく更新される場合があります。",
      commerce_back: "← Home",
    },

    "zh-Hant": {
      nav_features: "功能",
      nav_solution: "解決什麼問題",
      nav_pricing: "價格",
      nav_flow: "導入流程",
      nav_faq: "FAQ",
      nav_commerce: "特定商取引法表記",
      nav_disclosure: "商業披露",

      cta_contact: "聯絡我們",
      cta_disclosure: "商業披露",
      cta_download: "下載資料",
      cta_view_commerce: "特定商取引法表記",

      hero_kicker: "跨境電商用 / 銷售額・手續費・費用整理",
      hero_h1: "把帳務資料，\n整理得更清楚。",
      hero_p:
        "LedgerSeiri 是雲端軟體（SaaS），用於協助整理、彙總與分類銷售額／手續費／費用等資料。\n我們不提供資金保管、代收代付或稅務代理服務。",

      hero_btn_primary: "下載資料",
      hero_btn_secondary: "特定商取引法表記",

      badge_1_a: "最少化",
      badge_1_b: "輸入工時",
      badge_2_a: "輸出",
      badge_2_b: "CSV/Excel",
      badge_3_a: "Stripe 審核",
      badge_3_b: "表記完善",

      sec_features_h2: "主要功能",
      sec_features_sub:
        "把「會計軟體前的資料」先整理好，月度差異與漏項更早被發現。",
      f1_t: "自動整形銷售/手續費/費用",
      f1_p: "把 Amazon 等明細整理成可讀結構，方便後續科目/區分。",
      f2_t: "彙總（渠道/商品/期間）",
      f2_p: "按月/渠道/ASIN 等維度彙總，快速定位異常。",
      f3_t: "CSV/Excel 輸出",
      f3_p: "預設為可直接交付會計師或匯入會計工具的格式。",

      sec_solution_h2: "常見痛點，這樣解",
      sec_solution_sub:
        "例如：銷售額對不上、手續費太雜、退貨退款混在一起等。",
      sol_left_h: "痛點",
      sol_right_h: "LedgerSeiri 的做法",
      sol_1_b: "明細複雜，不知道哪些是銷售/手續費",
      sol_1_s: "整理欄位並讓分類更容易建立規則",
      sol_2_b: "退貨退款混在一起導致月度不一致",
      sol_2_s: "把退款相關拆分並可視化差分",
      sol_3_b: "每月要先整形才能交給會計師",
      sol_3_s: "用 CSV/Excel 輸出標準化交付",

      sec_pricing_h2: "價格（含消費稅）",
      pricing_note: "※ 價格暫定，正式上線前可能調整。",
      p1_t: "Starter",
      p1_y: "¥1,980/月",
      p2_t: "Standard",
      p2_y: "¥4,980/月",
      p3_t: "Business",
      p3_y: "¥9,980/月",
      p_ribbon: "推薦",
      p_common_1: "基本整理/分類",
      p_common_2: "CSV/Excel 輸出",
      p_common_3: "Email 支援",
      p_std_1: "彙總（渠道/商品）",
      p_std_2: "輸出模板擴充",
      p_std_3: "優先支援",
      p_bus_1: "團隊使用（多用戶）",
      p_bus_2: "高級分類規則",
      p_bus_3: "導入諮詢",

      sec_flow_h2: "導入流程",
      sec_flow_sub: "目標是最短時間建立每月可運轉的流程。",
      flow_1_b: "1) 準備資料",
      flow_1_s: "從 Amazon 等平台匯出 CSV/Excel",
      flow_2_b: "2) 整理與分類",
      flow_2_s: "整形銷售/手續費/費用並建立規則",
      flow_3_b: "3) 輸出並共享",
      flow_3_s: "以 CSV/Excel 交付會計師或會計工具",

      sec_voice_h2: "使用者心聲（示例）",
      q_1: "「月度對不上，原來是某個環節卡住了」",
      q_1_w: "Amazon 賣家（小規模）",
      q_2: "「把退款分開看，壓力小很多」",
      q_2_w: "跨境電商（多渠道）",
      q_3: "「交給會計師前的整形最耗時間」",
      q_3_w: "小公司（後勤）",

      sec_faq_h2: "常見問題",
      faq1_q: "LedgerSeiri 是會計軟體嗎？",
      faq1_a: "它是資料整理/彙總/分類工具，不提供稅務代理或資金保管。",
      faq2_q: "會保存信用卡資訊嗎？",
      faq2_a: "不保存。付款由 Stripe 等支付服務商處理（規劃中）。",
      faq3_q: "有 Stripe 審核用頁面嗎？",
      faq3_a: "有。菜單進入「特定商取引法表記 / 商業披露」。",

      band_h2: "先把 Stripe 審核常看的資訊整理好。",
      band_p: "特定商取引法表記、退款/解約、聯絡方式等，已集中呈現。",
      band_btn_1: "特定商取引法表記",
      band_btn_2: "前往商業披露",

      footer_company: "營運公司",
      footer_contact: "聯絡方式",
      footer_legal: "特定商取引法表記",
      footer_disclosure: "商業披露",
      footer_copy: "© 2026 LedgerSeiri",

      commerce_h1: "特定商取引法表記",
      commerce_lead:
        "本頁面提供通信販售相關法定資訊。LedgerSeiri 為 SaaS：協助整理/彙總/分類銷售額、手續費、費用等資料；不提供資金保管、代收代付或稅務代理服務。",
      commerce_disclosure_h2: "商業披露（Commerce Disclosure）",
      commerce_disclosure_p:
        "本頁包含支付機構/平台審核常要求的商業披露資訊，內容可能不定期更新。",
      commerce_back: "← 回首頁",
    },

    en: {
      nav_features: "Features",
      nav_solution: "Problems we solve",
      nav_pricing: "Pricing",
      nav_flow: "How it works",
      nav_faq: "FAQ",
      nav_commerce: "Commerce Disclosure (Japan)",
      nav_disclosure: "Commerce Disclosure",

      cta_contact: "Contact",
      cta_disclosure: "Commerce Disclosure",
      cta_download: "Download overview",
      cta_view_commerce: "Commerce disclosure",

      hero_kicker: "For cross-border e-commerce / Sales, fees, expenses data",
      hero_h1: "Organize your ledger data,\nwith clarity.",
      hero_p:
        "LedgerSeiri is a cloud-based software (SaaS) that helps you organize, aggregate, and categorize sales, fees, and expense data.\nWe do not provide fund custody, payment agency, or tax representation services.",

      hero_btn_primary: "Download overview",
      hero_btn_secondary: "Commerce disclosure",

      badge_1_a: "Minimize",
      badge_1_b: "manual work",
      badge_2_a: "Export",
      badge_2_b: "CSV/Excel",
      badge_3_a: "Stripe review",
      badge_3_b: "ready pages",

      sec_features_h2: "Core features",
      sec_features_sub:
        "Clean your data before accounting. Detect monthly mismatches and missing items early.",
      f1_t: "Normalize sales / fees / expenses",
      f1_p: "Turn marketplace statements into clean, readable structures.",
      f2_t: "Aggregation (channel / product / period)",
      f2_p: "Slice by month/channel/ASIN and spot anomalies early.",
      f3_t: "CSV/Excel export",
      f3_p: "Export formats designed for accountants and accounting tools.",

      sec_solution_h2: "Common problems, solved",
      sec_solution_sub:
        "Sales not matching, complex fee lines, refunds mixed in — designed around real operator pain.",
      sol_left_h: "Problem",
      sol_right_h: "LedgerSeiri approach",
      sol_1_b: "Statements are complex; hard to separate sales vs fees",
      sol_1_s: "Normalize fields and make rule-based categorization easy",
      sol_2_b: "Refunds mixed in; monthly totals look off",
      sol_2_s: "Separate refund lines and visualize deltas by dimension",
      sol_3_b: "Heavy manual cleanup before sending to accountants",
      sol_3_s: "Standardize handoff via CSV/Excel export",

      sec_pricing_h2: "Pricing (tax included)",
      pricing_note: "* Pricing is provisional and may change before official launch.",
      p1_t: "Starter",
      p1_y: "¥1,980/mo",
      p2_t: "Standard",
      p2_y: "¥4,980/mo",
      p3_t: "Business",
      p3_y: "¥9,980/mo",
      p_ribbon: "Popular",
      p_common_1: "Basic organization & categorization",
      p_common_2: "CSV/Excel export",
      p_common_3: "Email support",
      p_std_1: "Aggregation (channel/product)",
      p_std_2: "Advanced export templates",
      p_std_3: "Priority support",
      p_bus_1: "Team use (multiple users)",
      p_bus_2: "Advanced categorization rules",
      p_bus_3: "Onboarding consultation",

      sec_flow_h2: "How it works",
      sec_flow_sub: "Designed to get you into a monthly routine quickly.",
      flow_1_b: "1) Prepare data",
      flow_1_s: "Export CSV/Excel from Amazon and other channels",
      flow_2_b: "2) Organize & categorize",
      flow_2_s: "Normalize sales/fees/expenses and apply rules",
      flow_3_b: "3) Export & share",
      flow_3_s: "Deliver CSV/Excel to accountants or accounting tools",

      sec_voice_h2: "What users say (sample)",
      q_1: "\"Monthly numbers didn’t match — we found where it got stuck.\"",
      q_1_w: "Amazon seller (small scale)",
      q_2: "\"Separating refunds made everything less stressful.\"",
      q_2_w: "Cross-border, multi-channel",
      q_3: "\"Cleanup before sending to accountants was the bottleneck.\"",
      q_3_w: "Small business (back office)",

      sec_faq_h2: "FAQ",
      faq1_q: "Is LedgerSeiri an accounting app?",
      faq1_a:
        "It supports organizing/aggregating/categorizing data. It is not a tax representation or fund custody service.",
      faq2_q: "Do you store card numbers?",
      faq2_a:
        "No. Payments will be processed by Stripe or other payment providers.",
      faq3_q: "Do you have a Stripe review page?",
      faq3_a:
        "Yes. See “Commerce Disclosure / Disclosure” in the menu.",

      band_h2: "Make Stripe review easier—prepare disclosures first.",
      band_p:
        "Commerce disclosure, refund/cancellation policy, and contact details are clearly presented.",
      band_btn_1: "Commerce disclosure",
      band_btn_2: "Go to disclosure",

      footer_company: "Operator",
      footer_contact: "Contact",
      footer_legal: "Commerce disclosure",
      footer_disclosure: "Commerce Disclosure",
      footer_copy: "© 2026 LedgerSeiri",

      commerce_h1: "Commerce Disclosure (Japan)",
      commerce_lead:
        "This page provides legally required disclosures for online sales. LedgerSeiri is a SaaS that helps organize/aggregate/categorize sales, fees, and expense data. We do not provide fund custody, payment agency, or tax representation services.",
      commerce_disclosure_h2: "Disclosure (Commerce Disclosure)",
      commerce_disclosure_p:
        "This page includes information commonly required by payment providers/platform reviews and may be updated without notice.",
      commerce_back: "← Home",
    },
  };

  // =======================
  // i18n helpers
  // =======================
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

      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      const key = titleEl.getAttribute("data-i18n");
      if (d[key]) titleEl.textContent = d[key];
    }

    document.documentElement.setAttribute("lang", lang === "zh-Hant" ? "zh-Hant" : lang);
  }

  // =======================
  // Mobile drawer
  // =======================
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // =======================
  // Mailto helper (static CTA)
  // =======================
  function setupMailto() {
    const form = document.querySelector("[data-mailto-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("input")?.value?.trim() || "";
      const subject = "LedgerSeiri お問い合わせ";
      const body =
        "【お問い合わせ内容】\n" +
        "- 相談したいこと：\n" +
        "- 利用予定チャネル（例：Amazon JP / 楽天 / Shopify）：\n" +
        "- 取引量（概算）：\n\n" +
        (email ? `【返信先メール】${email}\n\n` : "") +
        "（このメールはLPから作成されました）";

      const mailto = `mailto:support@kimoca.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  // =======================
  // Dashboard mock (visual only)
  // =======================
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

    function apply(viewKey) {
      const view = views[viewKey] || views.month;

      // tab active
      tabs.forEach((btn) => {
        const key = btn.getAttribute("data-dash-tab");
        btn.classList.toggle("is-active", key === viewKey);
        btn.setAttribute("aria-selected", key === viewKey ? "true" : "false");
      });

      // kpis
      if (kpiEls.sales) kpiEls.sales.textContent = view.kpis.sales;
      if (kpiEls.fee) kpiEls.fee.textContent = view.kpis.fee;
      if (kpiEls.profit) kpiEls.profit.textContent = view.kpis.profit;

      // rows (expect 4)
      for (let i = 0; i < 4; i++) {
        if (rowLeftEls[i]) rowLeftEls[i].textContent = view.rows[i]?.left || "";
        if (rowBadgeEls[i]) rowBadgeEls[i].textContent = view.rows[i]?.badge || "";
      }
    }

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-dash-tab") || "month";
        apply(key);
      });
    });

    // default
    apply("month");
  }

  function init() {
    const lang = getLang();

    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
      sel.addEventListener("change", (e) => setLang(e.target.value));
    });

    applyLang(lang);
    setupDrawer();
    setupMailto();
    setupDashboardMock();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
