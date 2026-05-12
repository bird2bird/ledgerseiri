import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import MarketingFooter from "@/components/MarketingFooter";

const COMPANY_LEGAL_JA = "Kimoca Co., Ltd.（株式会社キモカ）";
const COMPANY_LEGAL_EN = "Kimoca Co., Ltd.";
const SUPPORT_EMAIL = "support@kimoca.com";

export default function PrivacyPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const ja = {
    title: "プライバシーポリシー",
    sections: [
      {
        h: "1. 取得する情報",
        p: [
          "当社（" + COMPANY_LEGAL_JA + "）は、LedgerSeiriの提供にあたり、アカウント情報、会社・ワークスペース情報、サービス利用ログ、インポートされた取引データ、銀行明細データ、請求書・証憑データ、Amazon連携により取得される注文関連データを取り扱います。",
        ],
      },
      {
        h: "2. Amazon Selling Partner APIを通じて取得するデータ",
        p: [
          "利用者がAmazon OAuthを通じてLedgerSeiriとの連携を明示的に承認した場合に限り、Amazon Selling Partner API（SP-API）を通じて、利用者自身のAmazon出品者アカウントに関連する注文データを取得します。",
          "取得対象の例は、注文ID、注文日時、注文ステータス、マーケットプレイスID、SKU、ASIN、商品名、販売数量、商品価格、配送方法またはフルフィルメント種別、インポート処理に必要なメタデータです。",
          "初期連携では、購入者の氏名、住所、電話番号などの購入者個人情報を利用目的の対象外とし、取得しない設計とします。",
        ],
      },
      {
        h: "3. 利用目的",
        p: [
          "取得したAmazonデータは、注文データの取込、売上金額の確認、SKU別販売数量の分析、在庫管理、インポート履歴の管理、銀行明細との照合、利用者による経営管理および会計資料整理の補助の目的で利用します。",
        ],
      },
      {
        h: "4. 第三者提供・広告利用の禁止",
        p: [
          "当社は、取得したAmazonデータを第三者に販売せず、広告目的で利用せず、利用目的の範囲を超えて共有しません。法令に基づく場合、利用者の同意がある場合、またはサービス提供に必要な委託先に限定して取り扱う場合を除き、第三者提供は行いません。",
        ],
      },
      {
        h: "5. 認証情報の取扱い",
        p: [
          "LedgerSeiriは、Amazon Seller CentralのログインID・パスワードを取得しません。Amazon連携トークンはサーバー側でのみ管理し、refresh token等の認証情報は暗号化して保存します。access token、refresh token、client secretをブラウザへ返却しません。",
        ],
      },
      {
        h: "6. 保管・削除・連携解除",
        p: [
          "利用者は、Amazon連携の解除またはアカウント解約を申請することにより、保存されたAmazon連携情報および関連データの削除を依頼できます。法令上保存が必要な情報を除き、当社は合理的な期間内に削除または匿名化を行います。",
        ],
      },
      {
        h: "7. 安全管理措置",
        p: [
          "当社は、HTTPS/TLS通信、認証情報の暗号化、会社・ワークスペース単位のデータ分離、アクセス制御、ログ管理等により、個人情報およびAmazonデータの安全管理に努めます。",
        ],
      },
      {
        h: "8. お問い合わせ",
        p: ["本ポリシーに関するお問い合わせは、" + SUPPORT_EMAIL + " までご連絡ください。"],
      },
    ],
  };

  const en = {
    title: "Privacy Policy",
    sections: [
      {
        h: "1. Information we process",
        p: [
          COMPANY_LEGAL_EN + " processes account data, company/workspace data, service logs, imported transaction data, bank statement data, invoice/evidence data, and Amazon order-related data obtained through Amazon integration.",
        ],
      },
      {
        h: "2. Amazon Selling Partner API data",
        p: [
          "Only when a user explicitly authorizes LedgerSeiri through Amazon OAuth, LedgerSeiri accesses the user's own Amazon seller order data through Amazon Selling Partner API.",
          "Examples include order ID, order date, order status, marketplace ID, SKU, ASIN, product title, quantity sold, item price, fulfillment or shipping method, and import metadata.",
          "In the initial integration scope, buyer name, address, and phone number are outside the intended use and are not designed to be collected.",
        ],
      },
      {
        h: "3. Purpose of use",
        p: [
          "Amazon data is used for order import, sales review, SKU-level sales analysis, inventory management, import history, bank reconciliation, business management, and bookkeeping document preparation.",
        ],
      },
      {
        h: "4. No sale or advertising use",
        p: [
          "We do not sell Amazon data to third parties, do not use it for advertising purposes, and do not share it beyond the stated purposes except where required by law, authorized by the user, or necessary for service providers.",
        ],
      },
      {
        h: "5. Credentials",
        p: [
          "LedgerSeiri does not collect Seller Central login IDs or passwords. Amazon tokens are managed server-side only. Refresh tokens and similar credentials are encrypted at rest. Access tokens, refresh tokens, and client secrets are not returned to the browser.",
        ],
      },
      {
        h: "6. Retention, deletion, and disconnection",
        p: [
          "Users may request disconnection of Amazon integration or deletion of related data. Unless retention is required by law, we will delete or anonymize such data within a reasonable period.",
        ],
      },
      {
        h: "7. Security measures",
        p: [
          "We use HTTPS/TLS, credential encryption, company/workspace-level data isolation, access control, and logging to protect personal information and Amazon data.",
        ],
      },
      {
        h: "8. Contact",
        p: ["For privacy inquiries, contact " + SUPPORT_EMAIL + "."],
      },
    ],
  };

  const content = lang === "en" ? en : ja;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight">{content.title}</h1>
          <div className="mt-8 space-y-8 text-slate-700">
            {content.sections.map((s) => (
              <section key={s.h}>
                <h2 className="text-lg font-black text-slate-950">{s.h}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7">
                  {s.p.map((p) => <p key={p}>{p}</p>)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <MarketingFooter lang={lang} />
    </main>
  );
}
