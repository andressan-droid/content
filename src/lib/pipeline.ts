// Orquestra a decisão de "o que gerar agora" para cada partida acompanhada.
// Usado tanto pelo worker (agendador) quanto pelas rotas de API para disparo manual.

import { prisma } from "@/lib/db";
import { refreshFixturesStatus } from "@/lib/sync";
import { generateContentForFixture } from "@/lib/content/generate";
import { ContentStage, ContentStatus, FixtureStatus } from "@/generated/prisma/enums";

const PRE_LEAD_HOURS = Number(process.env.PRE_LEAD_HOURS ?? 6);

async function hasGeneratedContent(fixtureId: string, stage: ContentStage): Promise<boolean> {
  const existing = await prisma.content.findUnique({
    where: { fixtureId_stage: { fixtureId, stage } },
  });
  return existing?.status === ContentStatus.GENERATED;
}

// Gera o conteúdo PRE-jogo para partidas dentro da janela configurada antes do início.
export async function generatePendingPreMatchContent() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + PRE_LEAD_HOURS * 60 * 60 * 1000);

  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.SCHEDULED,
      kickoff: { gte: now, lte: windowEnd },
    },
  });

  let generated = 0;
  for (const fixture of fixtures) {
    if (await hasGeneratedContent(fixture.id, ContentStage.PRE)) continue;
    await generateContentForFixture(fixture.id, ContentStage.PRE);
    generated++;
  }
  return generated;
}

// Atualiza o status das partidas "em janela ao vivo" (já começaram ou começam em breve)
// e gera o conteúdo de intervalo/pós-jogo assim que o status permitir.
export async function refreshLiveFixturesAndGenerateContent() {
  const now = new Date();
  const recentPast = new Date(now.getTime() - 4 * 60 * 60 * 1000); // partidas iniciadas nas últimas 4h
  const nearFuture = new Date(now.getTime() + 15 * 60 * 1000); // ou que começam nos próximos 15min

  const trackedFixtures = await prisma.fixture.findMany({
    where: {
      status: { in: [FixtureStatus.SCHEDULED, FixtureStatus.LIVE, FixtureStatus.HALFTIME] },
      kickoff: { gte: recentPast, lte: nearFuture },
    },
  });

  if (trackedFixtures.length === 0) return { checked: 0, halftime: 0, finished: 0 };

  await refreshFixturesStatus(trackedFixtures.map((f) => f.apiFootballId));

  const updated = await prisma.fixture.findMany({
    where: { id: { in: trackedFixtures.map((f) => f.id) } },
  });

  let halftime = 0;
  let finished = 0;
  for (const fixture of updated) {
    if (fixture.status === FixtureStatus.HALFTIME && !(await hasGeneratedContent(fixture.id, ContentStage.HALFTIME))) {
      await generateContentForFixture(fixture.id, ContentStage.HALFTIME);
      halftime++;
    }
    if (fixture.status === FixtureStatus.FINISHED && !(await hasGeneratedContent(fixture.id, ContentStage.POST))) {
      await generateContentForFixture(fixture.id, ContentStage.POST);
      finished++;
    }
  }

  return { checked: updated.length, halftime, finished };
}

export async function runContentPipelineCycle() {
  const pre = await generatePendingPreMatchContent();
  const live = await refreshLiveFixturesAndGenerateContent();
  return { pre, ...live };
}
