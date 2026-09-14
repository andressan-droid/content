import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { ContentStatus, CopyChannel } from "@/generated/prisma/enums";
import type { Copy } from "@/generated/prisma/client";
import { getAnthropicClient, ANTHROPIC_MODEL } from "./anthropic";
import { COPY_SYSTEM_PROMPT, buildCopyUserPrompt } from "./prompts";

function parseWithHeader(text: string, headerPrefix: string): { subject: string | null; body: string } {
  const parts = text.split(/\n-{3,}\n/);
  if (parts.length >= 2) {
    const headerLine = parts[0].trim();
    const subject = headerLine.startsWith(headerPrefix)
      ? headerLine.slice(headerPrefix.length).trim()
      : headerLine;
    return { subject, body: parts.slice(1).join("\n---\n").trim() };
  }
  return { subject: null, body: text.trim() };
}

async function callClaude(system: string, userPrompt: string): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock) {
    throw new Error("A Claude não retornou texto (resposta vazia ou recusada).");
  }
  return textBlock.text.trim();
}

export async function generateCopyForContent(contentId: string, channel: CopyChannel): Promise<Copy> {
  const content = await prisma.content.findUniqueOrThrow({
    where: { id: contentId },
    include: { fixture: { include: { club: true } } },
  });

  if (!content.body) {
    throw new Error("Este conteúdo ainda não foi gerado — gere o conteúdo base antes de criar a copy.");
  }

  try {
    const userPrompt = buildCopyUserPrompt({
      channel,
      stage: content.stage,
      clubName: content.fixture.club.name,
      contentTitle: content.title,
      contentBody: content.body,
    });

    const text = await callClaude(COPY_SYSTEM_PROMPT, userPrompt);

    let subject: string | null = null;
    let body = text;
    if (channel === CopyChannel.EMAIL) {
      ({ subject, body } = parseWithHeader(text, "ASSUNTO:"));
    } else if (channel === CopyChannel.NEWS) {
      ({ subject, body } = parseWithHeader(text, "TÍTULO:"));
    }

    return prisma.copy.upsert({
      where: { contentId_channel: { contentId, channel } },
      create: {
        contentId,
        channel,
        status: ContentStatus.GENERATED,
        subject,
        body,
        generatedAt: new Date(),
      },
      update: {
        status: ContentStatus.GENERATED,
        subject,
        body,
        generatedAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[copy] falha ao gerar ${channel} para content ${contentId}:`, message);
    return prisma.copy.upsert({
      where: { contentId_channel: { contentId, channel } },
      create: { contentId, channel, status: ContentStatus.FAILED, error: message },
      update: { status: ContentStatus.FAILED, error: message },
    });
  }
}
