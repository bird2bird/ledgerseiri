'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function detectLang(): string {
  const al = (navigator.language || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.startsWith('zh-hk') || al.startsWith('zh-mo')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  if (al.startsWith('en')) return 'en';
  return 'ja';
}

export default function LpRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${detectLang()}/lp`);
  }, [router]);
  return null;
}
