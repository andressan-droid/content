import { FixtureStatus } from "@/generated/prisma/enums";
import type { ApiFixture } from "@/lib/apiFootball";

// Referência dos status curtos da API-Football:
// https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures
const HALFTIME = new Set(["HT"]);
const LIVE = new Set(["1H", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
const POSTPONED = new Set(["PST"]);
const CANCELLED = new Set(["CANC", "ABD", "AWD", "WO"]);

export function mapApiStatusToFixtureStatus(statusShort: string): FixtureStatus {
  if (HALFTIME.has(statusShort)) return FixtureStatus.HALFTIME;
  if (LIVE.has(statusShort)) return FixtureStatus.LIVE;
  if (FINISHED.has(statusShort)) return FixtureStatus.FINISHED;
  if (POSTPONED.has(statusShort)) return FixtureStatus.POSTPONED;
  if (CANCELLED.has(statusShort)) return FixtureStatus.CANCELLED;
  return FixtureStatus.SCHEDULED; // TBD, NS e qualquer status ainda não mapeado
}

export function isFinishedStatus(statusShort: string): boolean {
  return FINISHED.has(statusShort);
}

export function fixtureFieldsFromApi(fx: ApiFixture) {
  return {
    leagueName: fx.league.name,
    leagueApiId: fx.league.id,
    season: fx.league.season,
    round: fx.league.round ?? null,
    homeTeamName: fx.teams.home.name,
    homeTeamApiId: fx.teams.home.id,
    homeTeamLogo: fx.teams.home.logo ?? null,
    awayTeamName: fx.teams.away.name,
    awayTeamApiId: fx.teams.away.id,
    awayTeamLogo: fx.teams.away.logo ?? null,
    homeGoals: fx.goals.home,
    awayGoals: fx.goals.away,
    homeGoalsHT: fx.score.halftime.home,
    awayGoalsHT: fx.score.halftime.away,
    venueName: fx.fixture.venue.name ?? null,
    venueCity: fx.fixture.venue.city ?? null,
    kickoff: new Date(fx.fixture.timestamp * 1000),
    status: mapApiStatusToFixtureStatus(fx.fixture.status.short),
    statusShort: fx.fixture.status.short,
  };
}
