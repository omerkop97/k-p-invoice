"use client";

import { useCallback, useEffect, useState } from "react";

import DraftsList, { type DraftSummary } from "@/components/DraftsList";
import { useLanguage } from "@/components/LanguageProvider";
import QuoteReviewForm from "@/components/QuoteReviewForm";
import Recorder, { type RecorderStatus } from "@/components/Recorder";
import SectionCard from "@/components/SectionCard";
import TranscriptPanel from "@/components/TranscriptPanel";
import {
  fromFormState,
  toFormState,
  type QuoteFormState,
} from "@/lib/quote-form";
import { emptyQuote, quoteSchema } from "@/lib/quote";
import { samples } from "@/lib/sample";

export default function QuoteWorkspace() {
  const { t, lang } = useLanguage();

  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [form, setForm] = useState<QuoteFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; key: string } | null>(null);

  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<"failed" | "sample" | "server" | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<"failed" | "sample" | "server" | null>(null);
  const [pdfWorking, setPdfWorking] = useState(false);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/drafts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDrafts(data.drafts);
    } catch {
      setMessage({ kind: "error", key: "loadFailed" });
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const messageText = (key: string): string => {
    const known: Record<string, string> = {
      saved: t.quote.saved,
      incomplete: t.quote.incomplete,
      pdfFailed: t.quote.pdfFailed,
      saveFailed: t.quote.saveFailed,
      openFailed: t.quote.openFailed,
      loadFailed: t.quote.loadFailed,
      deleteFailed: t.quote.deleteFailed,
    };
    return known[key] ?? key;
  };

  async function transcribe() {
    if (!audioBlob || transcribing) return;
    setTranscribing(true);
    setVoiceNotice(null);
    try {
      const formData = new FormData();
      const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", audioBlob, `recording.${extension}`);
      formData.append("lang", lang);
      if (draftId) formData.append("draftId", draftId);
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTranscript(data.transcript);
      setDraftId(data.draftId);
      if (data.source === "sample") setVoiceNotice("sample");
      await loadDrafts();
    } catch (err) {
      // A TypeError from fetch means the request never reached the server.
      setVoiceNotice(err instanceof TypeError ? "server" : "failed");
    } finally {
      setTranscribing(false);
    }
  }

  async function extractQuote() {
    if (!transcript.trim() || extracting) return;
    setExtracting(true);
    setExtractNotice(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, draftId, lang }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const quote = quoteSchema.parse(data.quote);
      setForm(toFormState(quote));
      setErrors({});
      setMessage(null);
      if (data.draftId) setDraftId(data.draftId);
      if (data.source === "sample") setExtractNotice("sample");
      await loadDrafts();
    } catch (err) {
      setExtractNotice(err instanceof TypeError ? "server" : "failed");
    } finally {
      setExtracting(false);
    }
  }

  async function generatePdf(mode: "download" | "preview") {
    if (!form || pdfWorking) return;
    const result = fromFormState(form);
    setErrors(result.errors);
    if (!result.quote) {
      setMessage({ kind: "error", key: "incomplete" });
      return;
    }

    setPdfWorking(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: result.quote, lang, draftId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (mode === "preview") {
        window.open(url, "_blank", "noopener");
      } else {
        const filenameMatch = res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filenameMatch?.[1] ?? "quote.pdf";
        anchor.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      await loadDrafts();
    } catch {
      setMessage({ kind: "error", key: "pdfFailed" });
    } finally {
      setPdfWorking(false);
    }
  }

  function startBlank() {
    setDraftId(null);
    setForm(toFormState(emptyQuote(lang)));
    setErrors({});
    setMessage(null);
  }

  function loadSample() {
    setDraftId(null);
    setForm(toFormState(samples[lang].quote));
    setErrors({});
    setMessage(null);
  }

  function closeEditor() {
    setDraftId(null);
    setForm(null);
    setErrors({});
    setMessage(null);
  }

  async function openDraft(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/drafts/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const stored = data.draft.quoteJson
        ? quoteSchema.parse(JSON.parse(data.draft.quoteJson))
        : emptyQuote(lang);
      setDraftId(id);
      setForm(toFormState(stored));
      setErrors({});
    } catch {
      setMessage({ kind: "error", key: "openFailed" });
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!form) return;
    const result = fromFormState(form);
    setErrors(result.errors);
    if (!result.quote) {
      setMessage({ kind: "error", key: "incomplete" });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const title = `${t.drafts.quoteTitlePrefix} — ${result.quote.customer.name}`;
      const res = draftId
        ? await fetch(`/api/drafts/${draftId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, quote: result.quote, status: "ready" }),
          })
        : await fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, quote: result.quote }),
          });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDraftId(data.draft.id);
      await loadDrafts();
      setMessage({ kind: "ok", key: "saved" });
    } catch {
      setMessage({ kind: "error", key: "saveFailed" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (id === draftId) closeEditor();
      await loadDrafts();
    } catch {
      setMessage({ kind: "error", key: "deleteFailed" });
    } finally {
      setBusy(false);
    }
  }

  const pillPrimary =
    "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50";
  const pillOutline =
    "rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-soft disabled:opacity-50";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t.voice.title}
          description={t.voice.desc}
          chip={{
            label: t.voice.statusLabel,
            value: transcribing
              ? t.voice.statuses.transcribing
              : t.voice.statuses[recorderStatus],
          }}
        >
          <div className="space-y-3">
            <Recorder
              onStatusChange={setRecorderStatus}
              onCaptured={setAudioBlob}
              onTranscribe={transcribe}
              transcribing={transcribing}
            />
            {voiceNotice && (
              <p
                className={`rounded-xl px-4 py-3 text-sm ${
                  voiceNotice === "sample"
                    ? "bg-accent/10 text-accent-dark"
                    : "bg-red-500/10 text-red-700"
                }`}
              >
                {voiceNotice === "sample"
                  ? t.voice.sampleUsed
                  : voiceNotice === "server"
                    ? t.common.serverDown
                    : t.voice.transcribeFailed}
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title={t.transcript.title} description={t.transcript.desc}>
          <div className="space-y-3">
            <TranscriptPanel
              transcript={transcript}
              onChange={setTranscript}
              onExtract={extractQuote}
              extracting={extracting}
            />
            {extractNotice && (
              <p
                className={`rounded-xl px-4 py-3 text-sm ${
                  extractNotice === "sample"
                    ? "bg-accent/10 text-accent-dark"
                    : "bg-red-500/10 text-red-700"
                }`}
              >
                {extractNotice === "sample"
                  ? t.transcript.extractSampleUsed
                  : extractNotice === "server"
                    ? t.common.serverDown
                    : t.transcript.extractFailed}
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t.quote.title} description={t.quote.desc}>
        {form ? (
          <div className="space-y-4">
            <QuoteReviewForm form={form} errors={errors} onChange={setForm} />
            {message && (
              <p
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.kind === "ok"
                    ? "bg-accent/10 text-accent-dark"
                    : "bg-red-500/10 text-red-700"
                }`}
              >
                {messageText(message.key)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveDraft}
                disabled={busy || pdfWorking}
                className={`${pillPrimary} flex-1`}
              >
                {busy ? t.quote.saving : draftId ? t.quote.saveChanges : t.quote.save}
              </button>
              <button
                onClick={() => generatePdf("preview")}
                disabled={busy || pdfWorking}
                className={pillOutline}
              >
                {pdfWorking ? t.quote.pdfWorking : t.quote.previewPdf}
              </button>
              <button
                onClick={() => generatePdf("download")}
                disabled={busy || pdfWorking}
                className={pillOutline}
              >
                {t.quote.downloadPdf}
              </button>
              <button
                onClick={closeEditor}
                disabled={busy || pdfWorking}
                className={pillOutline}
              >
                {t.quote.close}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={startBlank} className={`${pillPrimary} flex-1`}>
              {t.quote.startBlank}
            </button>
            <button onClick={loadSample} className={`${pillOutline} flex-1`}>
              {t.quote.loadSample}
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t.drafts.title} description={t.drafts.desc}>
        <DraftsList
          drafts={drafts}
          activeId={draftId}
          busy={busy}
          onOpen={openDraft}
          onDelete={deleteDraft}
        />
      </SectionCard>
    </div>
  );
}
