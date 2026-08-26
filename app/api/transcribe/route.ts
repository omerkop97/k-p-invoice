import { DeepgramClient } from "@deepgram/sdk";

import { prisma } from "@/lib/db";
import { samples } from "@/lib/sample";

// Audio uploads can be a few MB for a 60s recording; cap well above that.
const MAX_BYTES = 15 * 1024 * 1024;

function deepgramKey(): string | null {
  const key = process.env.DEEPGRAM_API_KEY;
  // Treat the .env.example placeholder as "no key" so the sample fallback
  // kicks in instead of a confusing 401 from Deepgram.
  if (!key || key.startsWith("plak-hier") || key === "...") return null;
  return key;
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json(
      { error: "Expected multipart/form-data with an 'audio' file" },
      { status: 400 },
    );
  }

  const draftIdRaw = form.get("draftId");
  const requestedDraftId =
    typeof draftIdRaw === "string" && draftIdRaw ? draftIdRaw : null;

  const apiKey = deepgramKey();
  let transcript: string;
  let source: "deepgram" | "sample";

  if (!apiKey) {
    const lang = form.get("lang") === "en" ? "en" : "nl";
    transcript = samples[lang].transcript;
    source = "sample";
  } else {
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json({ error: "Missing 'audio' file" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return Response.json({ error: "Audio file too large" }, { status: 413 });
    }

    try {
      const deepgram = new DeepgramClient({ apiKey });
      const response = await deepgram.listen.v1.media.transcribeFile(audio, {
        model: "nova-2",
        smart_format: true,
        detect_language: true,
      });
      // Without a callback URL the response is always the synchronous shape;
      // narrow the union to reach the transcript.
      transcript =
        "results" in response
          ? (response.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "")
          : "";
      source = "deepgram";
    } catch (err) {
      console.error("Deepgram transcription failed:", err);
      return Response.json({ error: "Transcription failed" }, { status: 502 });
    }
  }

  // Persist the transcript with its draft, creating the draft when the user
  // recorded before ever saving one.
  let draft = requestedDraftId
    ? await prisma.quoteDraft.findUnique({ where: { id: requestedDraftId } })
    : null;
  if (!draft) {
    draft = await prisma.quoteDraft.create({ data: {} });
  }
  await prisma.transcript.create({
    data: { draftId: draft.id, text: transcript, source },
  });

  return Response.json({ draftId: draft.id, transcript, source });
}
