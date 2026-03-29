import { PlatformShell } from "@/components/platform/PlatformShell";
import { PlatformRouteGuard } from "@/components/platform/PlatformRouteGuard";
import type { ReactNode } from "react";

export default async function PlatformLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <PlatformShell lang={lang} title="Admin Console">
      {children}
    </PlatformShell>
  );
}
