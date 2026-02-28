"use client";

import React, { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // 120px 就显示，LP 页面一般不会滚太深，阈值要低一点
      setShow(window.scrollY > 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-[9999] pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
    >
      <span className="text-slate-700 text-lg leading-none">↑</span>
    </button>
  );
}
