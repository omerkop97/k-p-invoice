"use client";

import { useLanguage } from "@/components/LanguageProvider";
import TotalsSummary from "@/components/TotalsSummary";
import { calculateTotals, formatMoney } from "@/lib/calculations";
import type { Dict } from "@/lib/i18n";
import {
  draftLineItems,
  draftVatRate,
  emptyLineItemForm,
  type LineItemFormState,
  type QuoteFormState,
} from "@/lib/quote-form";

interface QuoteReviewFormProps {
  form: QuoteFormState;
  errors: Record<string, string>;
  onChange: (form: QuoteFormState) => void;
}

const inputClass =
  "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm " +
  "outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

function translateError(t: Dict, key?: string): string | undefined {
  if (!key) return undefined;
  return t.errors[key as keyof Dict["errors"]] ?? key;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export default function QuoteReviewForm({
  form,
  errors,
  onChange,
}: QuoteReviewFormProps) {
  const { t, locale } = useLanguage();
  const set = (patch: Partial<QuoteFormState>) => onChange({ ...form, ...patch });

  const setLineItem = (index: number, patch: Partial<LineItemFormState>) => {
    const lineItems = form.lineItems.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    set({ lineItems });
  };

  const addLineItem = () =>
    set({ lineItems: [...form.lineItems, emptyLineItemForm()] });

  const removeLineItem = (index: number) =>
    set({ lineItems: form.lineItems.filter((_, i) => i !== index) });

  const liveItems = draftLineItems(form);
  const err = (path: string) => translateError(t, errors[path]);

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-bold">{t.quote.sections.customer}</legend>
        <Field label={t.quote.fields.name} error={err("customer.name")}>
          <input
            className={inputClass}
            value={form.customer.name}
            onChange={(e) =>
              set({ customer: { ...form.customer, name: e.target.value } })
            }
            placeholder="Jan Jansen"
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.quote.fields.email} error={err("customer.email")}>
            <input
              className={inputClass}
              type="email"
              value={form.customer.email}
              onChange={(e) =>
                set({ customer: { ...form.customer, email: e.target.value } })
              }
              placeholder="jan@example.com"
              autoComplete="off"
            />
          </Field>
          <Field label={t.quote.fields.phone} error={err("customer.phone")}>
            <input
              className={inputClass}
              value={form.customer.phone}
              onChange={(e) =>
                set({ customer: { ...form.customer, phone: e.target.value } })
              }
              placeholder="+31 6 1234 5678"
              autoComplete="off"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-bold">{t.quote.sections.address}</legend>
        <Field label={t.quote.fields.street} error={err("address.street")}>
          <input
            className={inputClass}
            value={form.address.street}
            onChange={(e) =>
              set({ address: { ...form.address, street: e.target.value } })
            }
            placeholder="Dorpsstraat 12"
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Field label={t.quote.fields.postalCode} error={err("address.postalCode")}>
            <input
              className={inputClass}
              value={form.address.postalCode}
              onChange={(e) =>
                set({ address: { ...form.address, postalCode: e.target.value } })
              }
              placeholder="1012 AB"
              autoComplete="off"
            />
          </Field>
          <Field label={t.quote.fields.city} error={err("address.city")}>
            <input
              className={inputClass}
              value={form.address.city}
              onChange={(e) =>
                set({ address: { ...form.address, city: e.target.value } })
              }
              placeholder="Amsterdam"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label={t.quote.fields.country} error={err("address.country")}>
          <input
            className={inputClass}
            value={form.address.country}
            onChange={(e) =>
              set({ address: { ...form.address, country: e.target.value } })
            }
            autoComplete="off"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-bold">{t.quote.sections.lineItems}</legend>
        {errors["lineItems"] && (
          <p className="text-xs text-red-700">{err("lineItems")}</p>
        )}
        <ul className="space-y-3">
          {form.lineItems.map((item, index) => (
            <li key={index} className="space-y-2 rounded-2xl border border-line p-3">
              <Field
                label={t.quote.fields.description}
                error={err(`lineItems.${index}.description`)}
              >
                <input
                  className={inputClass}
                  value={item.description}
                  onChange={(e) => setLineItem(index, { description: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={t.quote.fields.lineDetails}
                error={err(`lineItems.${index}.details`)}
              >
                <textarea
                  className={`${inputClass} min-h-14 resize-y`}
                  value={item.details}
                  onChange={(e) => setLineItem(index, { details: e.target.value })}
                  placeholder={t.quote.fields.lineDetailsPlaceholder}
                />
              </Field>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label={t.quote.fields.qty} error={err(`lineItems.${index}.quantity`)}>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(e) => setLineItem(index, { quantity: e.target.value })}
                  />
                </Field>
                <Field
                  label={t.quote.fields.unitPrice}
                  error={err(`lineItems.${index}.unitPrice`)}
                >
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => setLineItem(index, { unitPrice: e.target.value })}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={form.lineItems.length === 1}
                  className="rounded-full px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                  {t.quote.removeLine}
                </button>
              </div>
              <p className="text-right text-xs text-muted">
                {t.quote.lineTotal}{" "}
                <span className="font-semibold tabular-nums">
                  {formatMoney(
                    calculateTotals({ lineItems: [liveItems[index]], vatRate: 0 }).subtotal,
                    locale,
                  )}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addLineItem}
          className="w-full rounded-full border border-dashed border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
        >
          {t.quote.addLine}
        </button>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-bold">{t.quote.sections.terms}</legend>
        <div className="space-y-2 rounded-2xl border border-line p-3">
          <span className="block text-xs font-medium text-muted">
            {t.quote.vatModeLabel}
          </span>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name="vatMode"
              checked={form.vatMode === "standard"}
              onChange={() => set({ vatMode: "standard" })}
              className="h-4 w-4 accent-accent"
            />
            {t.quote.vatStandard}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name="vatMode"
              checked={form.vatMode === "verlegd"}
              onChange={() => set({ vatMode: "verlegd" })}
              className="h-4 w-4 accent-accent"
            />
            {t.quote.vatVerlegd}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {form.vatMode === "standard" && (
            <Field label={t.quote.fields.vatRate} error={err("vatRate")}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.vatRate}
                onChange={(e) => set({ vatRate: e.target.value })}
              />
            </Field>
          )}
          <Field label={t.quote.fields.validUntil} error={err("validUntil")}>
            <input
              className={inputClass}
              type="date"
              value={form.validUntil}
              onChange={(e) => set({ validUntil: e.target.value })}
            />
          </Field>
        </div>
        <Field label={t.quote.fields.notes} error={err("notes")}>
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </Field>
      </fieldset>

      <TotalsSummary
        lineItems={liveItems}
        vatRate={draftVatRate(form)}
        vatMode={form.vatMode}
      />
    </div>
  );
}
