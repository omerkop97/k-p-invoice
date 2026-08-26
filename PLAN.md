# Voice to Invoice — Build Plan

A mobile-first Next.js 16 app: speak a quote, get a transcript (Deepgram), extract a
structured quote (OpenAI), review/edit it, and export a locked, branded PDF.

## Folder structure (keep it clean, everything at root level)

- `app/` — App Router pages and API routes (server-only routes under `app/api/`)
- `components/` — React components
- `lib/` — shared logic: db client, Zod schemas, calculation helpers
- `prisma/` — schema; data lives in a local Prisma Postgres dev server
  (start with `npm run db`, runs on port 51214, no system install needed)
- `public/` — static assets (logo for PDF branding later)

## Secrets

API keys live in `.env.local` only (never committed). `.env` holds the non-secret
`DATABASE_URL`. `.env.example` documents the required shape:

- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `DATABASE_URL="postgres://postgres:postgres@localhost:51214/voice_to_invoice?sslmode=disable"`

## Phases

1. **Project shell and local data model** ✅
   Next.js 16 app (TypeScript, App Router, Tailwind), UI shell, Prisma +
   local Postgres (Prisma Postgres dev server) with `QuoteDraft` and
   `Transcript` models, core quote model + Zod validation, deterministic
   subtotal/VAT/total helpers, drafts API for persistence.
2. **Quote schema and editable review screen** ✅
   Render a sample quote and build the editable review form: customer details,
   address, line items, VAT, validity, notes. Incomplete-field validation.
3. **Voice recording in the browser** ✅
   `MediaRecorder` capture with permission handling, playback, re-recording,
   60s time limit, and fallback states for unsupported browsers. Includes the
   K&P Invoices visual restyle (cream/terracotta, two-column layout) and
   **NL/EN language switcher** (client-side i18n dictionary in `lib/i18n.ts`,
   persisted in localStorage, Dutch by default).
4. **Deepgram transcription route** ✅
   `POST /api/transcribe` accepts recorded audio (multipart), sends it to
   Deepgram (SDK v5, nova-2, smart_format, language detection), saves the
   transcript with the draft (creating one when needed), and returns
   `{ draftId, transcript, source }`. Falls back to the sample transcript
   when no `DEEPGRAM_API_KEY` is configured.
5. **OpenAI structured extraction and calculations** ✅
   `POST /api/extract` sends the transcript to OpenAI (structured outputs via
   `responses.parse` + `zodTextFormat`, model `OPENAI_MODEL` or gpt-4o-mini),
   re-validates through `quoteSchema`, persists onto the draft when linked,
   and fills the review form. Handles Dutch and English transcripts and
   resolves relative dates. Subtotal/total are computed in app code
   (`lib/calculations.ts`), never by the model. Falls back to the sample
   quote when no `OPENAI_API_KEY` is configured.
6. **PDF generation and lesson polish** ✅
   Branded PDF via `@react-pdf/renderer` (`POST /api/pdf`, NL/EN labels) with
   preview and download buttons in the quote card. Company branding lives in
   `lib/company.ts`.
   **Added requirements (implemented):**
   - **Watermark** on every page (diagonal company name, `fixed` element).
   - **Locked down**: post-processed with `@cantoo/pdf-lib` — AES-256
     owner-password encryption (random per document, never stored); viewing
     and high-res printing allowed, editing/copying/annotating disallowed.
   - **VAT modes**: radio choice on the review form — standard (VAT at the
     chosen rate on top of prices) or **btw verlegd** (reverse-charged: no
     VAT added; the quote/PDF shows the mandatory "Btw verlegd" mention).
     Carried through the Zod schema, calculations, extraction prompt, and PDF.
