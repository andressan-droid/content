import { generateContentForFixture } from "@/lib/content/generate";
import { ContentStage } from "@/generated/prisma/enums";

const VALID_STAGES = new Set(Object.values(ContentStage));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const stage = body?.stage;

  if (typeof stage !== "string" || !VALID_STAGES.has(stage as ContentStage)) {
    return Response.json(
      { ok: false, error: "stage inválido. Use PRE, HALFTIME ou POST." },
      { status: 400 }
    );
  }

  const content = await generateContentForFixture(id, stage as ContentStage);
  return Response.json({ ok: true, content });
}
