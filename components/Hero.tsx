"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/i18n";

export default function Hero() {
  const { t, lang, setLang } = useLanguage();

  const langButton = (code: Lang, label: string) => (
    <button
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        lang === code
          ? "bg-accent text-white"
          : "text-muted hover:bg-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.hero.brand}
        </p>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-line p-1">
          {langButton("nl", "NL")}
          {langButton("en", "EN")}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">{t.hero.subtitle}</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-line px-5 py-4">
          <p className="text-sm font-semibold">{t.hero.chipTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{t.hero.chipSub}</p>
        </div>
      </div>
    </section>
  );
}
