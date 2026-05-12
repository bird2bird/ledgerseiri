import MarketingFooter from "@/components/MarketingFooter";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

const COMPANY_LEGAL_JA = "Kimoca Co., Ltd.（株式会社キモカ）";
const SUPPORT_EMAIL = "support@kimoca.com";

export default function TermsPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const sections = [
    ["1. 本サービスについて", "LedgerSeiriは、Amazon出品者およびEC事業者向けに、注文データ、売上、在庫、銀行明細、証憑データ等の整理・確認を支援するクラウド型ソフトウェア（SaaS）です。本サービスは税務代理、会計監査、資金移動、決済代行を行うものではありません。"],
    ["2. アカウント管理", "利用者は、アカウント登録時に正確な情報を提供し、ログイン情報を適切に管理するものとします。不正利用または第三者による利用が疑われる場合、速やかに当社へ連絡してください。"],
    ["3. Amazon連携", "利用者がAmazon OAuthを通じて明示的に承認した場合に限り、LedgerSeiriはAmazon Selling Partner API（SP-API）を通じて、利用者自身のAmazon出品者アカウントに関連する注文データへアクセスします。LedgerSeiriはSeller CentralのログインID・パスワードを取得しません。"],
    ["4. データの利用目的", "Amazonデータおよびインポートデータは、注文データの取込、売上確認、SKU別販売数量の分析、在庫管理、インポート履歴管理、銀行明細との照合、会計資料整理の補助の目的で利用します。"],
    ["5. 禁止事項", "不正アクセス、サービスの濫用、第三者の権利侵害、法令違反、当社または他の利用者に損害を与える行為、虚偽情報の登録、リバースエンジニアリング等を禁止します。"],
    ["6. 料金・支払い", "有料プランの料金、支払方法、更新条件は、申込画面および特定商取引法に基づく表示に定めます。表示価格は税込です。"],
    ["7. 解約・連携解除", "利用者は、所定の方法またはサポート窓口への連絡により、本サービスの解約またはAmazon連携の解除を依頼できます。不要になった連携情報は、法令上保存が必要な情報を除き、合理的な期間内に削除または無効化します。"],
    ["8. 免責", "本サービスで表示されるデータ、集計、分析、AIによる示唆は、経営管理および資料整理の参考情報です。最終的な会計処理、税務判断、申告内容については、税理士等の専門家にご確認ください。"],
    ["9. 知的財産", "本サービスに関するソフトウェア、画面、文書、ロゴ、その他コンテンツに関する権利は、当社または正当な権利者に帰属します。"],
    ["10. 変更", "当社は、必要に応じて本規約または本サービスの内容を変更することがあります。重要な変更については、合理的な方法で通知します。"],
    ["11. 準拠法・管轄", "本規約は日本法に準拠します。本サービスに関連して紛争が生じた場合、当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。"],
    ["12. お問い合わせ", ],
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">利用規約</h1>
          <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
            {sections.map(([h, p]) => (
              <section key={h}>
                <h2 className="text-lg font-black text-slate-950">{h}</h2>
                <p className="mt-3">{p}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
      <MarketingFooter lang={lang} />
    </main>
  );
}
