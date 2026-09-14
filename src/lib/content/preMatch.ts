import type { ApiOdd, ApiPrediction, ApiStanding } from "@/lib/apiFootball";
import { formatDateTime, formatForm, pct } from "./helpers";

export interface PreMatchInput {
  clubName: string;
  homeTeamName: string;
  awayTeamName: string;
  isHome: boolean;
  leagueName: string;
  round: string | null;
  kickoff: Date;
  venueName: string | null;
  venueCity: string | null;
  prediction: ApiPrediction | null;
  odds: ApiOdd | null;
  standingsClub: ApiStanding | null;
  standingsOpponent: ApiStanding | null;
}

export interface GeneratedContent {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

function bestMatchWinnerOdds(odds: ApiOdd | null): { home?: string; draw?: string; away?: string } {
  if (!odds?.bookmakers?.length) return {};
  for (const bookmaker of odds.bookmakers) {
    const bet = bookmaker.bets.find((b) => b.name === "Match Winner");
    if (bet) {
      const home = bet.values.find((v) => v.value === "Home")?.odd;
      const draw = bet.values.find((v) => v.value === "Draw")?.odd;
      const away = bet.values.find((v) => v.value === "Away")?.odd;
      return { home, draw, away };
    }
  }
  return {};
}

export function buildPreMatchContent(input: PreMatchInput): GeneratedContent {
  const opponent = input.isHome ? input.awayTeamName : input.homeTeamName;
  const title = `Pré-jogo: ${input.homeTeamName} x ${input.awayTeamName}`;

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(
    `**${input.leagueName}${input.round ? ` — ${input.round}` : ""}** | ${formatDateTime(input.kickoff)}`
  );
  if (input.venueName) {
    lines.push(`📍 ${input.venueName}${input.venueCity ? `, ${input.venueCity}` : ""}`);
  }
  lines.push("");
  lines.push(`${input.clubName} ${input.isHome ? "recebe" : "visita"} ${opponent} nesta partida.`);

  if (input.standingsClub || input.standingsOpponent) {
    lines.push("");
    lines.push("## Situação na competição");
    if (input.standingsClub) {
      lines.push(
        `- ${input.clubName}: ${input.standingsClub.rank}º lugar, ${input.standingsClub.points} pts (${input.standingsClub.all.win}V ${input.standingsClub.all.draw}E ${input.standingsClub.all.lose}D), forma recente: ${formatForm(
          input.standingsClub.form
        )}`
      );
    }
    if (input.standingsOpponent) {
      lines.push(
        `- ${opponent}: ${input.standingsOpponent.rank}º lugar, ${input.standingsOpponent.points} pts (${input.standingsOpponent.all.win}V ${input.standingsOpponent.all.draw}E ${input.standingsOpponent.all.lose}D), forma recente: ${formatForm(
          input.standingsOpponent.form
        )}`
      );
    }
  }

  if (input.prediction) {
    const p = input.prediction.predictions;
    const c = input.prediction.comparison;
    lines.push("");
    lines.push("## Probabilidades do confronto");
    lines.push(
      `- Vitória ${input.homeTeamName}: ${pct(p.percent.home)} | Empate: ${pct(p.percent.draw)} | Vitória ${input.awayTeamName}: ${pct(p.percent.away)}`
    );
    if (p.advice) lines.push(`- Palpite estatístico da API: ${p.advice}`);
    if (p.goals.home || p.goals.away) {
      lines.push(`- Expectativa de gols: ${input.homeTeamName} ~${p.goals.home ?? "—"} | ${input.awayTeamName} ~${p.goals.away ?? "—"}`);
    }
    if (c) {
      lines.push("");
      lines.push("## Comparativo de desempenho");
      lines.push(`- Forma: ${c.form.home} x ${c.form.away}`);
      lines.push(`- Ataque: ${c.att.home} x ${c.att.away}`);
      lines.push(`- Defesa: ${c.def.home} x ${c.def.away}`);
      lines.push(`- Média de gols: ${c.goals.home} x ${c.goals.away}`);
      lines.push(`- Índice geral: ${c.total.home} x ${c.total.away}`);
    }
  }

  const marketOdds = bestMatchWinnerOdds(input.odds);
  if (marketOdds.home || marketOdds.draw || marketOdds.away) {
    lines.push("");
    lines.push("## Odds do mercado (1x2)");
    lines.push(
      `- ${input.homeTeamName}: ${marketOdds.home ?? "—"} | Empate: ${marketOdds.draw ?? "—"} | ${input.awayTeamName}: ${marketOdds.away ?? "—"}`
    );
  }

  if (input.prediction?.h2h?.length) {
    lines.push("");
    lines.push("## Retrospecto do confronto direto");
    const recent = input.prediction.h2h.slice(0, 5);
    for (const h of recent) {
      lines.push(
        `- ${new Date(h.fixture.date).toLocaleDateString("pt-BR")}: ${h.teams.home.name} ${h.goals.home ?? "-"} x ${h.goals.away ?? "-"} ${h.teams.away.name}`
      );
    }
  }

  return {
    title,
    body: lines.join("\n"),
    data: {
      prediction: input.prediction,
      odds: input.odds,
      standingsClub: input.standingsClub,
      standingsOpponent: input.standingsOpponent,
    },
  };
}
