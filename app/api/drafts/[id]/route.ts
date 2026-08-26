import { prisma } from "@/lib/db";
import { quoteSchema } from "@/lib/quote";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/drafts/[id]">,
) {
  const { id } = await ctx.params;
  const draft = await prisma.quoteDraft.findUnique({
    where: { id },
    include: { transcripts: { orderBy: { createdAt: "desc" } } },
  });
  if (!draft) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }
  return Response.json({ draft });
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/drafts/[id]">,
) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  const data: { title?: string; status?: string; quoteJson?: string } = {};
  if (typeof body.title === "string" && body.title) data.title = body.title;
  if (typeof body.status === "string") data.status = body.status;
  if (body.quote !== undefined) {
    const parsed = quoteSchema.safeParse(body.quote);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid quote", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    data.quoteJson = JSON.stringify(parsed.data);
  }

  try {
    const draft = await prisma.quoteDraft.update({ where: { id }, data });
    return Response.json({ draft });
  } catch {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/drafts/[id]">,
) {
  const { id } = await ctx.params;
  try {
    await prisma.quoteDraft.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }
}
