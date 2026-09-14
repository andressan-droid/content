import { prisma } from "@/lib/db";
import {
  ApiFootballError,
  getFixtureEvents,
  getFixtureStatistics,
  getFixturesByIds,
  getOdds,
  getPredictions,
  getStandings,
  type ApiOdd,
  type ApiPrediction,
  type ApiStanding,
} from "@/lib/apiFootball";
import { ContentStage, ContentStatus } from "@/generated/prisma/enums";
import type { Content, Fixture } from "@/generated/prisma/client";
import { fixtureFieldsFromApi } from "@/lib/fixtureStatus";
import { buildPreMatchContent } from "./preMatch";
import { buildHalftimeContent } from "./halftime";
import { buildPostMatchContent } from "./postMatch";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[content] falha ao buscar ${label}:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

async function findStandingRow(
  leagueId: number,
  season: number,
  teamId: number
): Promise<ApiStanding | null> {
  const result = await safe(() => getStandings(leagueId, season), [], "standings");
  const groups = result[0]?.league?.standings ?? [];
  for (const group of groups) {
    const row = group.find((r) => r.team.id === teamId);
    if (row) return row;
  }
  return null;
}

async function refreshFixtureFromApi(fixture: Fixture) {
  const [apiFixture] = await safe(() => getFixturesByIds([fixture.apiFootballId]), [], "fixture atualizada");
  if (!apiFixture) return fixture;
  const fields = fixtureFieldsFromApi(apiFixture);
  return prisma.fixture.update({ where: { id: fixture.id }, data: fields });
}

async function generatePre(fixture: Fixture, clubName: string) {
  let prediction: ApiPrediction | null = null;
  const predictions = await safe(() => getPredictions(fixture.apiFootballId), [], "predictions");
  prediction = predictions[0] ?? null;

  let odds: ApiOdd | null = null;
  const oddsList = await safe(() => getOdds(fixture.apiFootballId), [], "odds");
  odds = oddsList[0] ?? null;

  const isHome = fixture.homeTeamApiId === (await clubApiId(fixture));
  const clubTeamId = isHome ? fixture.homeTeamApiId : fixture.awayTeamApiId;
  const opponentTeamId = isHome ? fixture.awayTeamApiId : fixture.homeTeamApiId;

  const [standingsClub, standingsOpponent] = await Promise.all([
    findStandingRow(fixture.leagueApiId, fixture.season, clubTeamId),
    findStandingRow(fixture.leagueApiId, fixture.season, opponentTeamId),
  ]);

  return buildPreMatchContent({
    clubName,
    homeTeamName: fixture.homeTeamName,
    awayTeamName: fixture.awayTeamName,
    isHome,
    leagueName: fixture.leagueName,
    round: fixture.round,
    kickoff: fixture.kickoff,
    venueName: fixture.venueName,
    venueCity: fixture.venueCity,
    prediction,
    odds,
    standingsClub,
    standingsOpponent,
  });
}

async function clubApiId(fixture: Fixture): Promise<number> {
  const club = await prisma.club.findUniqueOrThrow({ where: { id: fixture.clubId } });
  return club.apiFootballId ?? fixture.homeTeamApiId;
}

async function generateHalftime(fixture: Fixture, clubName: string) {
  const fresh = await refreshFixtureFromApi(fixture);
  const statistics = await safe(() => getFixtureStatistics(fresh.apiFootballId), [], "estatísticas");
  const events = await safe(() => getFixtureEvents(fresh.apiFootballId), [], "eventos");

  return {
    content: buildHalftimeContent({
      clubName,
      homeTeamName: fresh.homeTeamName,
      homeTeamApiId: fresh.homeTeamApiId,
      awayTeamName: fresh.awayTeamName,
      awayTeamApiId: fresh.awayTeamApiId,
      leagueName: fresh.leagueName,
      homeGoalsHT: fresh.homeGoalsHT,
      awayGoalsHT: fresh.awayGoalsHT,
      statistics,
      events,
    }),
    fresh,
  };
}

async function generatePost(fixture: Fixture, clubName: string) {
  const fresh = await refreshFixtureFromApi(fixture);
  const statistics = await safe(() => getFixtureStatistics(fresh.apiFootballId), [], "estatísticas");
  const events = await safe(() => getFixtureEvents(fresh.apiFootballId), [], "eventos");
  const isHome = fresh.homeTeamApiId === (await clubApiId(fresh));

  return {
    content: buildPostMatchContent({
      clubName,
      isHome,
      homeTeamName: fresh.homeTeamName,
      homeTeamApiId: fresh.homeTeamApiId,
      awayTeamName: fresh.awayTeamName,
      awayTeamApiId: fresh.awayTeamApiId,
      leagueName: fresh.leagueName,
      homeGoals: fresh.homeGoals,
      awayGoals: fresh.awayGoals,
      statusLong: "Partida encerrada",
      statistics,
      events,
    }),
    fresh,
  };
}

export async function generateContentForFixture(
  fixtureId: string,
  stage: ContentStage
): Promise<Content> {
  const fixture = await prisma.fixture.findUniqueOrThrow({
    where: { id: fixtureId },
    include: { club: true },
  });

  try {
    let generated;
    if (stage === ContentStage.PRE) {
      generated = await generatePre(fixture, fixture.club.name);
    } else if (stage === ContentStage.HALFTIME) {
      generated = (await generateHalftime(fixture, fixture.club.name)).content;
    } else {
      generated = (await generatePost(fixture, fixture.club.name)).content;
    }

    return prisma.content.upsert({
      where: { fixtureId_stage: { fixtureId, stage } },
      create: {
        fixtureId,
        stage,
        status: ContentStatus.GENERATED,
        title: generated.title,
        body: generated.body,
        dataJson: JSON.stringify(generated.data),
        generatedAt: new Date(),
      },
      update: {
        status: ContentStatus.GENERATED,
        title: generated.title,
        body: generated.body,
        dataJson: JSON.stringify(generated.data),
        generatedAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    const message =
      err instanceof ApiFootballError || err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[content] falha ao gerar ${stage} para fixture ${fixtureId}:`, message);
    return prisma.content.upsert({
      where: { fixtureId_stage: { fixtureId, stage } },
      create: { fixtureId, stage, status: ContentStatus.FAILED, error: message },
      update: { status: ContentStatus.FAILED, error: message },
    });
  }
}
