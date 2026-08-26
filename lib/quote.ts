import { z } from "zod";

// Core quote model. This is the single source of truth for what a quote looks
// like: the review form edits it, OpenAI extraction must produce it, the DB
// stores it as JSON, and the PDF renders it.
//
// Validation messages are i18n keys (see lib/i18n.ts `errors`), translated at
// display time so the same schema serves both languages.

export const lineItemSchema = z.object({
  description: z.string().min(1, "description_required"),
  // Optional free-text remarks for this line: who works which hours on
  // time-and-materials (regie) items, the work location, and so on.
  details: z.string().default(""),
  quantity: z.number().positive("quantity_positive"),
  unitPrice: z.number().nonnegative("unit_price_nonnegative"), // in EUR
});

export const customerSchema = z.object({
  name: z.string().min(1, "customer_name_required"),
  email: z.email("invalid_email").or(z.literal("")).default(""),
  phone: z.string().default(""),
});

export const addressSchema = z.object({
  street: z.string().default(""),
  postalCode: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default("Netherlands"),
});

export const quoteSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  lineItems: z.array(lineItemSchema).min(1, "line_items_min"),
  // "standard": VAT is added on top of the prices at `vatRate`.
  // "verlegd": VAT reverse-charged (btw verlegd) — no VAT on the invoice.
  vatMode: z.enum(["standard", "verlegd"]).default("standard"),
  vatRate: z.number().min(0, "vat_range").max(100, "vat_range").default(21), // percent
  validUntil: z.iso.date("invalid_date").or(z.literal("")).default(""), // YYYY-MM-DD
  notes: z.string().default(""),
  currency: z.literal("EUR").default("EUR"),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Quote = z.infer<typeof quoteSchema>;

// A blank quote for starting a draft or seeding the review form. Built as a
// literal (not via parse) so fields can start empty for the user to fill in.
export function emptyQuote(lang: "nl" | "en" = "nl"): Quote {
  return {
    customer: { name: "", email: "", phone: "" },
    address: {
      street: "",
      postalCode: "",
      city: "",
      country: lang === "nl" ? "Nederland" : "Netherlands",
    },
    lineItems: [{ description: "", details: "", quantity: 1, unitPrice: 0 }],
    vatMode: "standard",
    vatRate: 21,
    validUntil: "",
    notes: "",
    currency: "EUR",
  };
}
