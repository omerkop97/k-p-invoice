"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { samples } from "@/lib/sample";

interface TranscriptPanelProps {
  transcript: string;
  onChange: (transcript: string) => void;
  onExtract: () => void;
  extracting: boolean;
}

export default function TranscriptPanel({
  transcript,
  onChange,
  onExtract,
  extracting,
}: TranscriptPanelProps) {
  const { t, lang } = useLanguage();
  return (
    <div className="rounded-2xl border border-line p-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          {t.transcript.textLabel}
        </span>
        <textarea
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.transcript.placeholder}
          className="min-h-56 w-full resize-y rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onExtract}
          disabled={!transcript.trim() || extracting}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {extracting ? t.transcript.extracting : t.transcript.extract}
        </button>
        <button
          onClick={() => onChange(samples[lang].transcript)}
          disabled={extracting}
          className="rounded-full border border-line px-4 py-2 text-xs font-medium text-muted transition hover:bg-soft hover:text-ink disabled:opacity-40"
        >
          {t.transcript.insertSample}
        </button>
      </div>
    </div>
  );
}
