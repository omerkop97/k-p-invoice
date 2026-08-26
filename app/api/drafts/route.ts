import { prisma } from "@/lib/db";
import { quoteSchema } from "@/lib/quote";

export async function GET() {
  const drafts = await prisma.quoteDraft.findMany({
    orderBy: { updatedAt: "desc" },
    include: { transcripts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return Response.json({ drafts });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  let quoteJson: string | undefined;
  if (body.quote !== undefined) {
    const parsed = quoteSchema.safeParse(body.quote);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid quote", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    quoteJson = JSON.stringify(parsed.data);
  }

  const draft = await prisma.quoteDraft.create({
    data: {
      title: typeof body.title === "string" && body.title ? body.title : undefined,
      quoteJson,
    },
  });
  return Response.json({ draft }, { status: 201 });
}
