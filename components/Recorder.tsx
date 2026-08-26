"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";

export type RecorderStatus =
  | "unsupported"
  | "idle"
  | "requesting"
  | "denied"
  | "recording"
  | "captured";

const MAX_SECONDS = 60;

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

interface RecorderProps {
  onStatusChange: (status: RecorderStatus) => void;
  onCaptured: (blob: Blob | null) => void;
  onTranscribe: () => void;
  transcribing: boolean;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Recorder({
  onStatusChange,
  onCaptured,
  onTranscribe,
  transcribing,
}: RecorderProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [capturedInfo, setCapturedInfo] = useState<{
    seconds: number;
    kb: number;
    mime: string;
  } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  function updateStatus(next: RecorderStatus) {
    setStatus(next);
    onStatusChange(next);
  }

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      updateStatus("unsupported");
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke old object URLs so re-recordings don't leak memory.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    updateStatus("requesting");
    setAudioUrl(null);
    setCapturedInfo(null);
    onCaptured(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      updateStatus("denied");
      return;
    }

    const mimeType = MIME_CANDIDATES.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    );
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      setAudioUrl(URL.createObjectURL(blob));
      setCapturedInfo({
        seconds: secondsRef.current,
        kb: blob.size / 1024,
        mime: blob.type,
      });
      onCaptured(blob);
      updateStatus("captured");
    };

    secondsRef.current = 0;
    setSeconds(0);
    recorder.start();
    updateStatus("recording");

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= MAX_SECONDS) stopRecording();
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  const pillBase =
    "rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const pillPrimary = `${pillBase} bg-accent text-white hover:bg-accent-dark`;
  const pillOutline = `${pillBase} border border-line bg-card hover:bg-soft`;

  if (status === "unsupported") {
    return (
      <p className="rounded-xl bg-soft px-4 py-3 text-sm text-muted">
        {t.voice.unsupportedMsg}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={startRecording}
          disabled={status === "recording" || status === "requesting" || transcribing}
          className={pillPrimary}
        >
          {t.voice.record}
        </button>
        <button
          onClick={stopRecording}
          disabled={status !== "recording"}
          className={pillOutline}
        >
          {t.voice.stop}
        </button>
        <button
          onClick={onTranscribe}
          disabled={status !== "captured" || transcribing}
          title={status !== "captured" ? t.voice.transcribeHint : undefined}
          className={pillOutline}
        >
          {t.voice.transcribe}
        </button>
        <button
          onClick={startRecording}
          disabled={status !== "captured" || transcribing}
          className={pillOutline}
        >
          {t.voice.rerecord}
        </button>
      </div>

      {status === "denied" && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {t.voice.deniedMsg}
        </p>
      )}

      <div className="mt-5 rounded-2xl bg-soft p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              {t.voice.lengthLabel}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {formatClock(status === "captured" ? (capturedInfo?.seconds ?? 0) : seconds)}
            </p>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${Math.min(
                  ((status === "captured" ? (capturedInfo?.seconds ?? 0) : seconds) /
                    MAX_SECONDS) *
                    100,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted">{t.voice.keepUnder}</p>

        {audioUrl && capturedInfo && (
          <div className="mt-4 rounded-xl bg-card p-3">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={audioUrl} className="w-full" />
            <p className="mt-2 text-xs text-muted">
              {capturedInfo.seconds}s {t.voice.recordingWord} ·{" "}
              {capturedInfo.kb.toFixed(1)} KB · {capturedInfo.mime}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
