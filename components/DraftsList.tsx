"use client";

import { useLanguage } from "@/components/LanguageProvider";

export interface DraftSummary {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

interface DraftsListProps {
  drafts: DraftSummary[] | null;
  activeId: string | null;
  busy: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DraftsList({
  drafts,
  activeId,
  busy,
  onOpen,
  onDelete,
}: DraftsListProps) {
  const { t, locale } = useLanguage();

  if (drafts === null) {
    return <p className="text-sm text-muted">{t.drafts.loading}</p>;
  }
  if (drafts.length === 0) {
    return <p className="text-sm text-muted">{t.drafts.empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {drafts.map((draft) => (
        <li
          key={draft.id}
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
            draft.id === activeId ? "border-accent/60 bg-accent/5" : "border-line"
          }`}
        >
          <button
            onClick={() => onOpen(draft.id)}
            disabled={busy}
            className="min-w-0 flex-1 text-left disabled:opacity-50"
          >
            <p className="truncate text-sm font-semibold">{draft.title}</p>
            <p className="text-xs text-muted">
              {draft.status} · {new Date(draft.updatedAt).toLocaleString(locale)}
            </p>
          </button>
          <button
            onClick={() => onDelete(draft.id)}
            disabled={busy}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {t.drafts.delete}
          </button>
        </li>
      ))}
    </ul>
  );
}
