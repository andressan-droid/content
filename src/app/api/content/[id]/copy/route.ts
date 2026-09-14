import { generateCopyForContent } from "@/lib/copy/generate";
import { CopyChannel } from "@/generated/prisma/enums";

const VALID_CHANNELS = new Set(Object.values(CopyChannel));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const channel = body?.channel;

  if (typeof channel !== "string" || !VALID_CHANNELS.has(channel as CopyChannel)) {
    return Response.json(
      { ok: false, error: "channel inválido. Use SOCIAL, EMAIL ou NEWS." },
      { status: 400 }
    );
  }

  const copy = await generateCopyForContent(id, channel as CopyChannel);
  return Response.json({ ok: true, copy });
}
