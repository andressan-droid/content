import { prisma } from "@/lib/db";
import { getUpcomingFixtures, getFixturesByIds, searchTeam } from "@/lib/apiFootball";
import { fixtureFieldsFromApi } from "@/lib/fixtureStatus";
import type { Club } from "@/generated/prisma/client";

const DEFAULT_UPCOMING_COUNT = Number(process.env.SYNC_UPCOMING_COUNT ?? 10);

// Resolve e cacheia o apiFootballId de um clube, caso ainda não esteja definido.
export async function resolveClubApiId(club: Club): Promise<Club> {
  if (club.apiFootballId) return club;

  const results = await searchTeam(club.name, club.country);
  const match = results[0];
  if (!match) {
    console.warn(`[sync] time não encontrado na API-Football para "${club.name}"`);
    return club;
  }

  return prisma.club.update({
    where: { id: club.id },
    data: { apiFootballId: match.team.id },
  });
}

// Busca as próximas partidas de um clube na API-Football e faz upsert no banco.
export async function syncClubFixtures(club: Club): Promise<number> {
  const resolved = await resolveClubApiId(club);
  if (!resolved.apiFootballId) return 0;

  const apiFixtures = await getUpcomingFixtures(resolved.apiFootballId, DEFAULT_UPCOMING_COUNT);

  for (const apiFixture of apiFixtures) {
    await prisma.fixture.upsert({
      where: { apiFootballId: apiFixture.fixture.id },
      create: {
        clubId: resolved.id,
        apiFootballId: apiFixture.fixture.id,
        ...fixtureFieldsFromApi(apiFixture),
      },
      update: {
        ...fixtureFieldsFromApi(apiFixture),
      },
    });
  }

  return apiFixtures.length;
}

export async function syncAllClubs(): Promise<{ club: string; fixtures: number }[]> {
  const clubs = await prisma.club.findMany({ where: { active: true } });
  const results: { club: string; fixtures: number }[] = [];
  for (const club of clubs) {
    try {
      const count = await syncClubFixtures(club);
      results.push({ club: club.name, fixtures: count });
    } catch (err) {
      console.error(`[sync] erro ao sincronizar ${club.name}:`, err instanceof Error ? err.message : err);
      results.push({ club: club.name, fixtures: 0 });
    }
  }
  return results;
}

// Atualiza status/placar de um conjunto específico de fixtures (usado no polling ao vivo).
export async function refreshFixturesStatus(apiFootballIds: number[]) {
  if (apiFootballIds.length === 0) return;
  const apiFixtures = await getFixturesByIds(apiFootballIds);
  for (const apiFixture of apiFixtures) {
    await prisma.fixture.update({
      where: { apiFootballId: apiFixture.fixture.id },
      data: fixtureFieldsFromApi(apiFixture),
    });
  }
}
