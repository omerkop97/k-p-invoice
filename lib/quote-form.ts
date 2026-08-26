import { quoteSchema, type LineItem, type Quote } from "@/lib/quote";

// The review form edits everything as strings (so typing "12," or clearing a
// field never fights the input), and converts to a validated Quote on save.

export interface LineItemFormState {
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface QuoteFormState {
  customer: { name: string; email: string; phone: string };
  address: { street: string; postalCode: string; city: string; country: string };
  lineItems: LineItemFormState[];
  vatMode: "standard" | "verlegd";
  vatRate: string;
  validUntil: string;
  notes: string;
}

// Accepts both "12.5" and the Dutch "12,5". Returns NaN when not a number.
export function parseNumber(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return NaN;
  return Number(normalized);
}

export function toFormState(quote: Quote): QuoteFormState {
  return {
    customer: { ...quote.customer },
    address: { ...quote.address },
    lineItems: quote.lineItems.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),
    vatMode: quote.vatMode,
    vatRate: String(quote.vatRate),
    validUntil: quote.validUntil,
    notes: quote.notes,
  };
}

export interface FormValidationResult {
  quote?: Quote;
  // Keyed by dot-path, e.g. "customer.name" or "lineItems.0.quantity".
  errors: Record<string, string>;
}

export function fromFormState(form: QuoteFormState): FormValidationResult {
  const candidate = {
    customer: form.customer,
    address: form.address,
    lineItems: form.lineItems.map((item) => ({
      description: item.description.trim(),
      quantity: parseNumber(item.quantity),
      unitPrice: parseNumber(item.unitPrice),
    })),
    vatMode: form.vatMode,
    vatRate: parseNumber(form.vatRate),
    validUntil: form.validUntil,
    notes: form.notes,
    currency: "EUR" as const,
  };

  const parsed = quoteSchema.safeParse(candidate);
  if (parsed.success) {
    return { quote: parsed.data, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.code === "invalid_type" ? "enter_number" : issue.message;
    }
  }
  return { errors };
}

// Best-effort line items for live totals while the user is still typing;
// unparseable numbers count as 0 so totals never show NaN.
export function draftLineItems(form: QuoteFormState): LineItem[] {
  return form.lineItems.map((item) => {
    const quantity = parseNumber(item.quantity);
    const unitPrice = parseNumber(item.unitPrice);
    return {
      description: item.description,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
      unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0,
    };
  });
}

export function draftVatRate(form: QuoteFormState): number {
  if (form.vatMode === "verlegd") return 0;
  const rate = parseNumber(form.vatRate);
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0;
}

export function emptyLineItemForm(): LineItemFormState {
  return { description: "", quantity: "1", unitPrice: "" };
}
