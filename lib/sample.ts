import type { Lang } from "@/lib/i18n";
import type { Quote } from "@/lib/quote";

// Sample data per language, used for the lesson's fallback path: render the
// review screen without recording anything, and test transcription/extraction
// without API keys. The active UI language decides which sample is used.

const en = {
  transcript:
    "New quote for Jan Jansen at Dorpsstraat 12, 1012 AB Amsterdam. " +
    "Painting the living room and hallway, that's 16 hours at 45 euros an hour. " +
    "Materials, paint and tape, 120 euros. Renting a ladder for two days at " +
    "15 euros a day. Standard 21 percent VAT, quote valid until the end of " +
    "next month. Note that we can only start in week 40.",
  quote: {
    customer: {
      name: "Jan Jansen",
      email: "jan.jansen@example.com",
      phone: "+31 6 1234 5678",
    },
    address: {
      street: "Dorpsstraat 12",
      postalCode: "1012 AB",
      city: "Amsterdam",
      country: "Netherlands",
    },
    lineItems: [
      { description: "Painting living room and hallway (16h)", quantity: 16, unitPrice: 45 },
      { description: "Materials: paint and tape", quantity: 1, unitPrice: 120 },
      { description: "Ladder rental (2 days)", quantity: 2, unitPrice: 15 },
    ],
    vatMode: "standard",
    vatRate: 21,
    validUntil: "2026-09-30",
    notes: "Work can start in week 40 at the earliest.",
    currency: "EUR",
  } satisfies Quote as Quote,
};

const nl = {
  transcript:
    "Nieuwe offerte voor Jan Jansen, Dorpsstraat 12, 1012 AB Amsterdam. " +
    "Woonkamer en gang schilderen, 16 uur à 45 euro per uur. Materiaal, " +
    "verf en tape, 120 euro. Ladderhuur, twee dagen à 15 euro per dag. " +
    "Standaard 21 procent btw, offerte geldig tot eind volgende maand. " +
    "Let op: we kunnen pas in week 40 beginnen.",
  quote: {
    customer: {
      name: "Jan Jansen",
      email: "jan.jansen@example.com",
      phone: "+31 6 1234 5678",
    },
    address: {
      street: "Dorpsstraat 12",
      postalCode: "1012 AB",
      city: "Amsterdam",
      country: "Nederland",
    },
    lineItems: [
      { description: "Woonkamer en gang schilderen (16 uur)", quantity: 16, unitPrice: 45 },
      { description: "Materiaal: verf en tape", quantity: 1, unitPrice: 120 },
      { description: "Ladderhuur (2 dagen)", quantity: 2, unitPrice: 15 },
    ],
    vatMode: "standard",
    vatRate: 21,
    validUntil: "2026-09-30",
    notes: "Werkzaamheden kunnen op z'n vroegst in week 40 starten.",
    currency: "EUR",
  } satisfies Quote as Quote,
};

export const samples: Record<Lang, { transcript: string; quote: Quote }> = {
  en,
  nl,
};
