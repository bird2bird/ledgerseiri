"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    const fromCookie = (getCookie("NEXT_LOCALE") || "").trim();
    const fromStorage = (typeof localStorage !== "undefined" ? (localStorage.getItem("ls_lang") || "") : "").trim();
    const langRaw = fromCookie || fromStorage || "ja";

    const lang =
      langRaw === "zh" || langRaw === "zh-cn" || langRaw === "zh-CN" ? "zh-CN" :
      langRaw === "zh-tw" || langRaw === "zh-TW" ? "zh-TW" :
      langRaw === "en" ? "en" : "ja";

    router.replace(`/${lang}/login`);
  }, [router]);

  return null;
}
