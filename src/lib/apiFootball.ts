// Cliente HTTP fino para a API-Football (https://www.api-football.com/documentation-v3).
//
// Autenticação: por padrão usa o host direto api-sports.io com o header `x-apisports-key`.
// Se a chave for de um plano contratado via RapidAPI, defina API_FOOTBALL_HOST=v3.football.api-sports.io
// continua igual — a API-Football aceita a mesma key nos dois hosts quando contratada direto.
// Para RapidAPI puro, ajuste API_FOOTBALL_USE_RAPIDAPI=true no .env.

const API_KEY = process.env.API_FOOTBALL_KEY;
const USE_RAPIDAPI = process.env.API_FOOTBALL_USE_RAPIDAPI === "true";
const BASE_URL = USE_RAPIDAPI
  ? "https://api-football-v1.p.rapidapi.com/v3"
  : "https://v3.football.api-sports.io";

class ApiFootballError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiFootballError";
  }
}

async function apiFootballGet<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  if (!API_KEY) {
    throw new ApiFootballError(
      "API_FOOTBALL_KEY não configurada. Defina a variável de ambiente com sua chave da API-Football."
    );
  }

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = USE_RAPIDAPI
    ? {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      }
    : { "x-apisports-key": API_KEY };

  const res = await fetch(url.toString(), { headers, cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiFootballError(
      `API-Football respondeu ${res.status} para ${path}: ${text.slice(0, 300)}`,
      res.status
    );
  }

  const json = (await res.json()) as { response: T; errors?: unknown };
  if (json.errors && Array.isArray(json.errors) ? json.errors.length > 0 : json.errors) {
    throw new ApiFootballError(`API-Football retornou erro em ${path}: ${JSON.stringify(json.errors)}`);
  }

  return json.response;
}

// ---- Tipos mínimos (apenas os campos que o app efetivamente usa) ----

export interface ApiTeam {
  team: { id: number; name: string; logo: string; country: string };
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    venue: { name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: { id: number; name: string; season: number; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiFixtureStatistic {
  team: { id: number; name: string };
  statistics: { type: string; value: string | number | null }[];
}

export interface ApiFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

export interface ApiPrediction {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string | null; away: string | null };
    advice: string | null;
    percent: { home: string; draw: string; away: string };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  teams: {
    home: { league: { form: string | null } };
    away: { league: { form: string | null } };
  };
  h2h: ApiFixture[];
}

export interface ApiOdd {
  bookmakers: {
    name: string;
    bets: { name: string; values: { value: string; odd: string }[] }[];
  }[];
}

export interface ApiStanding {
  rank: number;
  team: { id: number; name: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  all: { played: number; win: number; draw: number; lose: number };
}

// ---- Endpoints usados pelo app ----

export function searchTeam(name: string, country = "Brazil") {
  return apiFootballGet<ApiTeam[]>("/teams", { search: name, country });
}

export function getUpcomingFixtures(teamId: number, next = 15) {
  return apiFootballGet<ApiFixture[]>("/fixtures", { team: teamId, next });
}

export function getFixturesByIds(ids: number[]) {
  if (ids.length === 0) return Promise.resolve([] as ApiFixture[]);
  return apiFootballGet<ApiFixture[]>("/fixtures", { ids: ids.join("-") });
}

export function getLiveFixtures() {
  return apiFootballGet<ApiFixture[]>("/fixtures", { live: "all" });
}

export function getFixtureStatistics(fixtureId: number) {
  return apiFootballGet<ApiFixtureStatistic[]>("/fixtures/statistics", { fixture: fixtureId });
}

export function getFixtureEvents(fixtureId: number) {
  return apiFootballGet<ApiFixtureEvent[]>("/fixtures/events", { fixture: fixtureId });
}

export function getPredictions(fixtureId: number) {
  return apiFootballGet<ApiPrediction[]>("/predictions", { fixture: fixtureId });
}

export function getOdds(fixtureId: number) {
  return apiFootballGet<ApiOdd[]>("/odds", { fixture: fixtureId });
}

export function getStandings(leagueId: number, season: number) {
  return apiFootballGet<{ league: { standings: ApiStanding[][] } }[]>("/standings", {
    league: leagueId,
    season,
  });
}

export { ApiFootballError };
