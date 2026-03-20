import React from "react";

export function JobsLoadingState(props: { text: string }) {
  return (
    <main className="space-y-6">
      <section className="ls-card-solid rounded-[28px] p-6">
        <div className="text-sm text-slate-500">{props.text}</div>
      </section>
    </main>
  );
}
