import { PDFDocument } from "@cantoo/pdf-lib";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import QuotePdf from "@/components/pdf/QuotePdf";
import { prisma } from "@/lib/db";
import { dictionaries, locales, type Lang } from "@/lib/i18n";
import { quoteSchema } from "@/lib/quote";

// Locks the PDF against easy editing: viewers can open and print it freely
// (no user password), but modifying, copying, and annotating require the
// owner password, which is random per document and never stored.
async function lockPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const ownerPassword = crypto.randomUUID() + crypto.randomUUID();
  doc.encrypt({
    ownerPassword,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
    },
  });
  return doc.save();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = quoteSchema.safeParse(body?.quote);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid quote", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const quote = parsed.data;
  const lang: Lang = body?.lang === "en" ? "en" : "nl";
  const draftId = typeof body?.draftId === "string" && body.draftId ? body.draftId : null;

  try {
    const document = createElement(QuotePdf, {
      quote,
      t: dictionaries[lang],
      locale: locales[lang],
      // renderToBuffer expects a <Document> element; QuotePdf renders one.
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const rendered = await renderToBuffer(document);
    const locked = await lockPdf(rendered);

    if (draftId) {
      // Best effort: mark the draft as exported.
      await prisma.quoteDraft
        .update({ where: { id: draftId }, data: { status: "exported" } })
        .catch(() => undefined);
    }

    const safeName = quote.customer.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${dictionaries[lang].pdf.docTitle.toLowerCase()}-${safeName || "quote"}.pdf`;

    return new Response(new Uint8Array(locked), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return Response.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
