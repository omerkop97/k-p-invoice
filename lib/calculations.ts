import type { LineItem, Quote } from "@/lib/quote";

// All money math happens here, deterministically, in integer cents — never in
// the AI model and never with raw floating point on euro amounts.

export function toCents(eur: number): number {
  return Math.round(eur * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

// Per-line total in cents, rounded per line (the convention most Dutch
// invoicing tools use).
export function lineTotalCents(item: LineItem): number {
  return Math.round(item.quantity * toCents(item.unitPrice));
}

export interface QuoteTotals {
  subtotal: number; // EUR
  vatAmount: number; // EUR
  total: number; // EUR
}

export function calculateTotals(
  quote: Pick<Quote, "lineItems" | "vatRate"> & Partial<Pick<Quote, "vatMode">>,
): QuoteTotals {
  const subtotalCents = quote.lineItems.reduce(
    (sum, item) => sum + lineTotalCents(item),
    0,
  );
  // "btw verlegd" (VAT reverse-charged): no VAT is added on the invoice.
  const vatCents =
    quote.vatMode === "verlegd"
      ? 0
      : Math.round((subtotalCents * quote.vatRate) / 100);
  return {
    subtotal: fromCents(subtotalCents),
    vatAmount: fromCents(vatCents),
    total: fromCents(subtotalCents + vatCents),
  };
}

export function formatMoney(
  eur: number,
  locale: string = "nl-NL",
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(eur);
}
