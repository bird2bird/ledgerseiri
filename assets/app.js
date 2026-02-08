(function () {
  const DEFAULT_LANG = "ja";

  const dict = {
    ja: {
      nav_features: "機能",
      nav_pricing: "料金",
      nav_how: "導入イメージ",
      nav_faq: "FAQ",
      nav_commerce: "特定商取引法に基づく表記",
      nav_disclosure: "商業披露",

      cta_contact: "お問い合わせ",
      cta_disclosure: "商業披露",

      hero_kicker: "クロスボーダーEC向け / データ整理に特化",
      hero_h1: "帳簿データを、\n正しく整理する。",
      hero_p:
        "LedgerSeiriは、売上・手数料・費用データの整理・集計・分類を支援するクラウド型ソフトウェア（SaaS）です。\n資金の保管、決済代行、税務代理業務は行いません。",
      hero_btn_price: "料金を見る",
      hero_btn_commerce: "特定商取引法に基づく表記",

      badge_1_a: "データ入力は",
      badge_1_b: "最小化",
      badge_2_a: "出力は",
      badge_2_b: "CSV/Excel",
      badge_3_a: "払い戻し方針を",
      badge_3_b: "明記",

      dash_title: "ダッシュボード（例）",
      dash_pill_1: "月次",
      dash_pill_2: "チャネル別",
      dash_pill_3: "商品別",
      dash_stat_1: "売上（例）",
      dash_stat_2: "手数料（例）",
      dash_stat_3: "粗利（例）",
      dash_row_1: "Amazon 手数料",
      dash_tag_1: "整理済み",
      dash_row_2: "広告費（SP/SD）",
      dash_tag_2: "集計",
      dash_row_3: "返金/返品",
      dash_tag_3: "分類",
      dash_row_4: "税理士向け出力",
      dash_tag_4: "CSV/Excel",
      dash_note: "※ 上記はイメージです。実際の数値・項目はご利用内容により異なります。",

      sec_features_h2: "主要機能",
      f1_t: "売上・手数料・費用を整理",
      f1_p: "ECモールの明細を読みやすい形へ整形。データの迷子をなくします。",
      f2_t: "集計と可視化",
      f2_p: "月次/チャネル別/商品別などの集計軸で、数字のズレを早期発見。",
      f3_t: "CSV/Excel出力",
      f3_p: "税理士・会計ツール向けに、そのまま渡せる形式で出力可能。",

      sec_pricing_h2: "料金（消費税込）",
      p1_t: "Starter",
      p1_y: "¥1,980/月",
      p2_t: "Standard",
      p2_y: "¥4,980/月",
      p3_t: "Business",
      p3_y: "¥9,980/月",
      pricing_note:
        "※ 料金は暫定です。正式公開前に変更となる場合があります。",

      sec_how_h2: "導入イメージ",
      how_left_h: "最短で始める",
      how_left_p:
        "1) CSV/Excelをアップロード\n2) 自動で整理・集計\n3) そのまま出力して共有",
      how_right_h: "データの扱い",
      how_right_p:
        "決済情報（カード番号など）は保存しません。\n決済はStripe等の決済事業者で処理します。",

      sec_faq_h2: "よくある質問",
      q1: "LedgerSeiriは会計ソフトですか？",
      a1:
        "会計データの整理・集計・分類を支援するツールです。会計帳簿の作成や税務代理は行いません。",
      q2: "無料トライアルはありますか？",
      a2: "準備中です。公開時にホームページで案内します。",
      q3: "対応する出力形式は？",
      a3: "CSV/Excel形式での出力を想定しています。",

      footer_company: "運営会社",
      footer_contact: "お問い合わせ",
      footer_legal: "特定商取引法に基づく表記",
      footer_disclosure: "商業披露",
      footer_copy: "© 2026 LedgerSeiri",
    },

    "zh-Hant": {
      nav_features: "功能",
      nav_pricing: "價格",
      nav_how: "導入示意",
      nav_faq: "FAQ",
      nav_commerce: "特定商取引法表記",
      nav_disclosure: "商業披露",

      cta_contact: "聯絡我們",
      cta_disclosure: "商業披露",

      hero_kicker: "跨境電商用 / 專注資料整理",
      hero_h1: "把帳務資料，\n整理得更正確。",
      hero_p:
        "LedgerSeiri 是雲端軟體（SaaS），用於協助整理、彙總與分類銷售額／手續費／費用等資料。\n我們不提供資金保管、代收代付或稅務代理服務。",
      hero_btn_price: "查看價格",
      hero_btn_commerce: "特定商取引法表記",

      badge_1_a: "最少化",
      badge_1_b: "資料輸入",
      badge_2_a: "支援輸出",
      badge_2_b: "CSV/Excel",
      badge_3_a: "退款政策",
      badge_3_b: "清楚明示",

      dash_title: "儀表板（示例）",
      dash_pill_1: "月度",
      dash_pill_2: "按渠道",
      dash_pill_3: "按商品",
      dash_stat_1: "銷售額（示例）",
      dash_stat_2: "手續費（示例）",
      dash_stat_3: "毛利（示例）",
      dash_row_1: "Amazon 手續費",
      dash_tag_1: "已整理",
      dash_row_2: "廣告費（SP/SD）",
      dash_tag_2: "彙總",
      dash_row_3: "退款/退貨",
      dash_tag_3: "分類",
      dash_row_4: "輸出給會計師",
      dash_tag_4: "CSV/Excel",
      dash_note: "※ 以上為示意，實際數值與項目會依使用內容而異。",

      sec_features_h2: "主要功能",
      f1_t: "整理銷售/手續費/費用",
      f1_p: "把平台明細變成易讀結構，避免資料失控。",
      f2_t: "彙總與可視化",
      f2_p: "月度/渠道/商品等維度彙總，快速定位差異。",
      f3_t: "CSV/Excel 輸出",
      f3_p: "可直接交付會計師或匯入會計工具。",

      sec_pricing_h2: "價格（含消費稅）",
      p1_t: "Starter",
      p1_y: "¥1,980/月",
      p2_t: "Standard",
      p2_y: "¥4,980/月",
      p3_t: "Business",
      p3_y: "¥9,980/月",
      pricing_note: "※ 價格為暫定，正式上線前可能調整。",

      sec_how_h2: "導入示意",
      how_left_h: "快速開始",
      how_left_p: "1) 上傳 CSV/Excel\n2) 自動整理與彙總\n3) 一鍵輸出分享",
      how_right_h: "資料處理",
      how_right_p: "不保存信用卡號等敏感支付資訊。\n付款由 Stripe 等支付服務商處理。",

      sec_faq_h2: "常見問題",
      q1: "LedgerSeiri 是會計軟體嗎？",
      a1: "它是資料整理/彙總/分類工具，不提供稅務代理或資金保管。",
      q2: "有免費試用嗎？",
      a2: "準備中，將於官網公告。",
      q3: "支援哪些輸出格式？",
      a3: "預計支援 CSV/Excel。",

      footer_company: "營運公司",
      footer_contact: "聯絡方式",
      footer_legal: "特定商取引法表記",
      footer_disclosure: "商業披露",
      footer_copy: "© 2026 LedgerSeiri",
    },

    en: {
      nav_features: "Features",
      nav_pricing: "Pricing",
      nav_how: "How it works",
      nav_faq: "FAQ",
      nav_commerce: "Commerce Disclosure (Japan)",
      nav_disclosure: "Commerce Disclosure",

      cta_contact: "Contact",
      cta_disclosure: "Commerce Disclosure",

      hero_kicker: "For cross-border e-commerce / Data organization",
      hero_h1: "Organize your ledger data,\ncorrectly.",
      hero_p:
        "LedgerSeiri is a cloud-based software (SaaS) that helps you organize, aggregate, and categorize sales, fees, and expense data.\nWe do not provide fund custody, payment agency, or tax representation services.",
      hero_btn_price: "View pricing",
      hero_btn_commerce: "Commerce disclosure",

      badge_1_a: "Minimal",
      badge_1_b: "data input",
      badge_2_a: "Export",
      badge_2_b: "CSV/Excel",
      badge_3_a: "Clear",
      badge_3_b: "refund policy",

      dash_title: "Dashboard (sample)",
      dash_pill_1: "Monthly",
      dash_pill_2: "By channel",
      dash_pill_3: "By product",
      dash_stat_1: "Sales (sample)",
      dash_stat_2: "Fees (sample)",
      dash_stat_3: "Gross profit (sample)",
      dash_row_1: "Amazon fees",
      dash_tag_1: "Organized",
      dash_row_2: "Ads (SP/SD)",
      dash_tag_2: "Aggregate",
      dash_row_3: "Refunds/Returns",
      dash_tag_3: "Categorize",
      dash_row_4: "Export for accountants",
      dash_tag_4: "CSV/Excel",
      dash_note: "* Sample only. Actual metrics and items depend on your usage.",

      sec_features_h2: "Core features",
      f1_t: "Organize sales / fees / expenses",
      f1_p: "Turn marketplace statements into clean, readable data.",
      f2_t: "Aggregation & visibility",
      f2_p: "Slice by month/channel/product and detect mismatches early.",
      f3_t: "CSV/Excel export",
      f3_p: "Export in formats ready for accountants and accounting tools.",

      sec_pricing_h2: "Pricing (tax included)",
      p1_t: "Starter",
      p1_y: "¥1,980/mo",
      p2_t: "Standard",
      p2_y: "¥4,980/mo",
      p3_t: "Business",
      p3_y: "¥9,980/mo",
      pricing_note: "* Pricing is provisional and may change before official launch.",

      sec_how_h2: "How it works",
      how_left_h: "Get started fast",
      how_left_p: "1) Upload CSV/Excel\n2) Auto organize & aggregate\n3) Export and share",
      how_right_h: "Payments & data",
      how_right_p:
        "We do not store card numbers.\nPayments are processed by Stripe or other payment providers.",

      sec_faq_h2: "FAQ",
      q1: "Is LedgerSeiri an accounting app?",
      a1: "It supports organizing/aggregating/categorizing data. It is not a tax representation or fund custody service.",
      q2: "Do you offer a free trial?",
      a2: "Coming soon. We will announce it on the website.",
      q3: "What export formats are supported?",
      a3: "CSV/Excel export is planned.",

      footer_company: "Operator",
      footer_contact: "Contact",
      footer_legal: "Commerce disclosure",
      footer_disclosure: "Commerce Disclosure",
      footer_copy: "© 2026 LedgerSeiri",
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
    // sync selects
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
        // allow \n in headings
        el.textContent = val;
      }
    });

    // Titles / meta
    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      const key = titleEl.getAttribute("data-i18n");
      if (d[key]) titleEl.textContent = d[key];
    }

    document.documentElement.setAttribute("lang", lang === "zh-Hant" ? "zh-Hant" : lang);
  }

  function init() {
    const lang = getLang();

    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
      sel.addEventListener("change", (e) => setLang(e.target.value));
    });

    applyLang(lang);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
