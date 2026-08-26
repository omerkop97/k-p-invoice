// Server-only: rendered with @react-pdf/renderer in app/api/pdf/route.ts.
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { calculateTotals, formatMoney } from "@/lib/calculations";
import { company } from "@/lib/company";
import type { Dict } from "@/lib/i18n";
import type { Quote } from "@/lib/quote";

const ink = "#26221c";
const muted = "#756e60";
const line = "#e5dcc8";
const soft = "#f6efe2";
const accent = "#a5502e";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: ink,
    backgroundColor: "#fffdf8",
  },
  watermark: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 90,
    color: accent,
    opacity: 0.07,
    transform: "rotate(-30deg)",
    fontFamily: "Helvetica-Bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: accent },
  brandSub: {
    fontSize: 9,
    color: muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  companyInfo: { textAlign: "right", color: muted, lineHeight: 1.5 },
  title: { fontSize: 26, fontFamily: "Helvetica-Bold", marginBottom: 18 },
  metaRow: { flexDirection: "row", gap: 24, marginBottom: 24 },
  metaBlock: { flexGrow: 1 },
  metaLabel: {
    fontSize: 8,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: { lineHeight: 1.5 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: soft,
    borderRadius: 4,
    padding: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  row: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: line,
  },
  colDescription: { flexBasis: 0, flexGrow: 5, paddingRight: 8 },
  colQty: { flexBasis: 0, flexGrow: 1, textAlign: "right" },
  colPrice: { flexBasis: 0, flexGrow: 2, textAlign: "right" },
  colAmount: { flexBasis: 0, flexGrow: 2, textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: ink,
    marginTop: 4,
    paddingTop: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  verlegd: {
    marginTop: 10,
    padding: 8,
    backgroundColor: soft,
    borderRadius: 4,
    color: muted,
  },
  notes: { marginTop: 28 },
  notesText: { color: muted, lineHeight: 1.6 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 8,
    fontSize: 8,
    color: muted,
    textAlign: "center",
  },
});

interface QuotePdfProps {
  quote: Quote;
  t: Dict;
  locale: string;
}

export default function QuotePdf({ quote, t, locale }: QuotePdfProps) {
  const totals = calculateTotals(quote);
  const today = new Date().toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const validUntil = quote.validUntil
    ? new Date(`${quote.validUntil}T00:00:00`).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const addressParts = [
    quote.address.street,
    `${quote.address.postalCode} ${quote.address.city}`.trim(),
    quote.address.country,
  ].filter((part) => part && part.trim());

  return (
    <Document title={`${t.pdf.docTitle} — ${quote.customer.name}`}>
      <Page size="A4" style={styles.page}>
        {/* Watermark on every page */}
        <Text style={styles.watermark} fixed>
          {company.watermark}
        </Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{company.name}</Text>
            <Text style={styles.brandSub}>{company.tagline}</Text>
          </View>
          <View style={styles.companyInfo}>
            {company.addressLines.map((addressLine) => (
              <Text key={addressLine}>{addressLine}</Text>
            ))}
            <Text>{company.email}</Text>
            <Text>{company.phone}</Text>
            <Text>
              {company.kvk} · {company.btw}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{t.pdf.docTitle}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{t.pdf.to}</Text>
            <Text style={styles.metaValue}>{quote.customer.name}</Text>
            {addressParts.map((part) => (
              <Text key={part} style={styles.metaValue}>
                {part}
              </Text>
            ))}
            {quote.customer.email ? (
              <Text style={styles.metaValue}>{quote.customer.email}</Text>
            ) : null}
            {quote.customer.phone ? (
              <Text style={styles.metaValue}>{quote.customer.phone}</Text>
            ) : null}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{t.pdf.date}</Text>
            <Text style={styles.metaValue}>{today}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{t.pdf.validUntil}</Text>
            <Text style={styles.metaValue}>{validUntil}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>{t.pdf.description}</Text>
          <Text style={styles.colQty}>{t.pdf.qty}</Text>
          <Text style={styles.colPrice}>{t.pdf.unitPrice}</Text>
          <Text style={styles.colAmount}>{t.pdf.amount}</Text>
        </View>
        {quote.lineItems.map((item, index) => (
          <View key={index} style={styles.row} wrap={false}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatMoney(item.unitPrice, locale)}
            </Text>
            <Text style={styles.colAmount}>
              {formatMoney(
                calculateTotals({ lineItems: [item], vatRate: 0 }).subtotal,
                locale,
              )}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{t.pdf.subtotal}</Text>
            <Text>{formatMoney(totals.subtotal, locale)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>
              {quote.vatMode === "verlegd"
                ? t.pdf.verlegdNote
                : `${t.pdf.vat} (${quote.vatRate}%)`}
            </Text>
            <Text>
              {quote.vatMode === "verlegd"
                ? "—"
                : formatMoney(totals.vatAmount, locale)}
            </Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>{t.pdf.total}</Text>
            <Text>{formatMoney(totals.total, locale)}</Text>
          </View>
        </View>

        {quote.vatMode === "verlegd" ? (
          <View style={styles.verlegd}>
            <Text>{t.pdf.verlegdNote}</Text>
          </View>
        ) : null}

        {quote.notes ? (
          <View style={styles.notes}>
            <Text style={styles.metaLabel}>{t.pdf.notes}</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          {company.name} · {company.email} · {company.phone}
        </Text>
      </Page>
    </Document>
  );
}
