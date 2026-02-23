import type { Lang } from "./lang";

export type AuthDict = {
  brandSub: string;

  loginTitle: string;
  loginSubtitle: string;
  email: string;
  password: string;
  show: string;
  keepMe: string;
  login: string;
  forgot: string;
  firstTimeTitle: string;
  firstTimeSub: string;
  registerCta: string;

  registerTitle: string;
  haveAccount: string;
  backToLogin: string;
  min8: string;
  agreePrefix: string;
  terms: string;
  privacy: string;
  agreeSuffix: string;
  register: string;

  forgotTitle: string;
  forgotSubtitle: string;
  sendReset: string;

  footerPrivacy: string;
  footerTerms: string;
  footerStatus: string;

  langLabel: string;
  langJA: string;
  langEN: string;
  langZHCN: string;
  langZHTW: string;
};

const DICT: Record<Lang, AuthDict> = {
  ja: {
    brandSub: "私のポータル",

    loginTitle: "ログイン",
    loginSubtitle: "メールアドレスとパスワードを入力して「ログイン」を押してください。",
    email: "メール",
    password: "パスワード",
    show: "表示",
    keepMe: "ログイン状態を保持する",
    login: "ログイン",
    forgot: "パスワードを忘れた？",
    firstTimeTitle: "初めての方",
    firstTimeSub: "アカウントがない場合はこちら。",
    registerCta: "新規登録",

    registerTitle: "新規登録",
    haveAccount: "すでにアカウントをお持ちですか？",
    backToLogin: "ログインへ戻る",
    min8: "（8文字以上）",
    agreePrefix: "私は",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    agreeSuffix: "に同意します。",
    register: "登録",

    forgotTitle: "パスワード再設定",
    forgotSubtitle: "メールアドレスを入力すると、再設定手順を送信します。",
    sendReset: "再設定リンクを送信",

    footerPrivacy: "プライバシーポリシー",
    footerTerms: "利用規約",
    footerStatus: "サービス状態",

    langLabel: "言語",
    langJA: "JA",
    langEN: "EN",
    langZHCN: "简",
    langZHTW: "繁",
  },
  en: {
    brandSub: "My portal",

    loginTitle: "Sign in",
    loginSubtitle: "Enter your email and password, then click “Sign in”.",
    email: "Email",
    password: "Password",
    show: "Show",
    keepMe: "Keep me signed in",
    login: "Sign in",
    forgot: "Forgot password?",
    firstTimeTitle: "New here?",
    firstTimeSub: "Create an account to get started.",
    registerCta: "Create account",

    registerTitle: "Create account",
    haveAccount: "Already have an account?",
    backToLogin: "Back to sign in",
    min8: "(min 8 chars)",
    agreePrefix: "I agree to the",
    terms: "Terms",
    privacy: "Privacy Policy",
    agreeSuffix: ".",
    register: "Create",

    forgotTitle: "Reset password",
    forgotSubtitle: "Enter your email and we’ll send a reset link.",
    sendReset: "Send reset link",

    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms",
    footerStatus: "Status",

    langLabel: "Language",
    langJA: "JA",
    langEN: "EN",
    langZHCN: "简",
    langZHTW: "繁",
  },
  "zh-CN": {
    brandSub: "我的门户",

    loginTitle: "登录",
    loginSubtitle: "请输入邮箱与密码，然后点击“登录”。",
    email: "邮箱",
    password: "密码",
    show: "显示",
    keepMe: "保持登录状态",
    login: "登录",
    forgot: "忘记密码？",
    firstTimeTitle: "首次使用",
    firstTimeSub: "还没有账号？点击注册。",
    registerCta: "注册新账号",

    registerTitle: "注册新账号",
    haveAccount: "已有账号？",
    backToLogin: "返回登录",
    min8: "（至少 8 位）",
    agreePrefix: "我已阅读并同意",
    terms: "服务条款",
    privacy: "隐私政策",
    agreeSuffix: "。",
    register: "注册",

    forgotTitle: "忘记密码",
    forgotSubtitle: "请输入邮箱，我们会发送重置链接。",
    sendReset: "发送重置链接",

    footerPrivacy: "隐私政策",
    footerTerms: "服务条款",
    footerStatus: "服务状态",

    langLabel: "语言",
    langJA: "JA",
    langEN: "EN",
    langZHCN: "简",
    langZHTW: "繁",
  },
  "zh-TW": {
    brandSub: "我的入口",

    loginTitle: "登入",
    loginSubtitle: "請輸入電子郵件與密碼，然後按「登入」。",
    email: "電子郵件",
    password: "密碼",
    show: "顯示",
    keepMe: "保持登入狀態",
    login: "登入",
    forgot: "忘記密碼？",
    firstTimeTitle: "首次使用",
    firstTimeSub: "沒有帳號？立即註冊。",
    registerCta: "註冊新帳號",

    registerTitle: "註冊新帳號",
    haveAccount: "已有帳號？",
    backToLogin: "返回登入",
    min8: "（至少 8 位）",
    agreePrefix: "我已閱讀並同意",
    terms: "服務條款",
    privacy: "隱私政策",
    agreeSuffix: "。",
    register: "註冊",

    forgotTitle: "忘記密碼",
    forgotSubtitle: "輸入電子郵件，我們會寄送重置連結。",
    sendReset: "寄送重置連結",

    footerPrivacy: "隱私政策",
    footerTerms: "服務條款",
    footerStatus: "服務狀態",

    langLabel: "語言",
    langJA: "JA",
    langEN: "EN",
    langZHCN: "简",
    langZHTW: "繁",
  },
};

export function authDict(lang: Lang): AuthDict {
  return DICT[lang] ?? DICT.ja;
}
