import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { quoteSchema, type Quote } from "@/lib/quote";
import { samples } from "@/lib/sample";

// Strict schema for OpenAI structured outputs: every field required, no
// defaults or unions. The result is then re-validated through quoteSchema,
// which applies our defaults and business rules.
const extractionSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  address: z.object({
    street: z.string(),
    postalCode: z.string(),
    city: z.string(),
    country: z.string(),
  }),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
    }),
  ),
  vatMode: z.enum(["standard", "verlegd"]),
  vatRate: z.number(),
  validUntil: z.string(),
  notes: z.string(),
});

function openaiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("plak-hier") || key === "sk-...") return null;
  return key;
}

function systemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "You extract structured quote data from a spoken transcript of a tradesperson describing a job quote.",
    `Today's date is ${today}.`,
    "Rules:",
    "- The transcript may be Dutch or English; keep names, descriptions and notes in the transcript's language.",
    "- Resolve relative dates like 'end of next month' to a concrete YYYY-MM-DD date. If no validity is mentioned, use an empty string.",
    "- Prices are in euros. quantity is the amount (hours, days, pieces); unitPrice is the price per unit in euros.",
    "- vatRate is a percentage; use 21 when the transcript does not mention VAT.",
    "- vatMode: use 'verlegd' ONLY when the transcript mentions reverse-charged VAT ('btw verlegd', 'VAT reverse-charged'); otherwise 'standard'.",
    "- Use an empty string for any text field the transcript does not mention.",
    "- Do NOT calculate totals; the application computes those.",
  ].join("\n");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
  const draftId = typeof body?.draftId === "string" && body.draftId ? body.draftId : null;

  if (!transcript) {
    return Response.json({ error: "Missing 'transcript'" }, { status: 400 });
  }

  const apiKey = openaiKey();
  let quote: Quote;
  let source: "openai" | "sample";

  if (!apiKey) {
    quote = samples[body?.lang === "en" ? "en" : "nl"].quote;
    source = "sample";
  } else {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.responses.parse({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: transcript },
        ],
        text: { format: zodTextFormat(extractionSchema, "quote") },
      });
      const extracted = response.output_parsed;
      if (!extracted) throw new Error("No parsed output");

      const validated = quoteSchema.safeParse(extracted);
      if (!validated.success) {
        return Response.json(
          { error: "Extraction incomplete", issues: validated.error.issues },
          { status: 422 },
        );
      }
      quote = validated.data;
      source = "openai";
    } catch (err) {
      console.error("OpenAI extraction failed:", err);
      return Response.json({ error: "Extraction failed" }, { status: 502 });
    }
  }

  // When the transcript already belongs to a draft, persist the extracted
  // quote on it so the draft list reflects the customer right away.
  let persistedDraftId: string | null = null;
  if (draftId) {
    try {
      const draft = await prisma.quoteDraft.update({
        where: { id: draftId },
        data: {
          quoteJson: JSON.stringify(quote),
          title: `Quote — ${quote.customer.name}`,
        },
      });
      persistedDraftId = draft.id;
    } catch {
      persistedDraftId = null; // draft was deleted meanwhile; still return the quote
    }
  }

  return Response.json({ quote, source, draftId: persistedDraftId });
}
