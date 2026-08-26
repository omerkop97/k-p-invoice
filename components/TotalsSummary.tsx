"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { calculateTotals, formatMoney } from "@/lib/calculations";
import type { LineItem, Quote } from "@/lib/quote";

interface TotalsSummaryProps {
  lineItems: LineItem[];
  vatRate: number;
  vatMode: Quote["vatMode"];
}

export default function TotalsSummary({
  lineItems,
  vatRate,
  vatMode,
}: TotalsSummaryProps) {
  const { t, locale } = useLanguage();
  const totals = calculateTotals({ lineItems, vatRate, vatMode });
  return (
    <dl className="space-y-1.5 rounded-2xl bg-soft p-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">{t.quote.subtotal}</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotal, locale)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">
          {vatMode === "verlegd" ? t.quote.vatVerlegdShort : `${t.quote.vat} (${vatRate}%)`}
        </dt>
        <dd className="tabular-nums">
          {vatMode === "verlegd" ? "—" : formatMoney(totals.vatAmount, locale)}
        </dd>
      </div>
      <div className="flex justify-between border-t border-line pt-1.5 font-bold">
        <dt>{t.quote.total}</dt>
        <dd className="tabular-nums">{formatMoney(totals.total, locale)}</dd>
      </div>
    </dl>
  );
}
