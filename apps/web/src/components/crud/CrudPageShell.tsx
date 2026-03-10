"use client";

import React from "react";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";

export function CrudPageShell({
  title,
  description,
  actions,
  filters,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <PageHeader title={title} description={description} actions={actions} />
      {filters ? (
        <section className="ls-card-solid rounded-[28px] p-5">{filters}</section>
      ) : null}
      <section className="ls-card-solid rounded-[28px] p-5">{children}</section>
    </PageShell>
  );
}
