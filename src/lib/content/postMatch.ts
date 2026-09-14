import type { ApiFixtureEvent, ApiFixtureStatistic } from "@/lib/apiFootball";
import { minuteLabel, resultLabel, statValue } from "./helpers";
import type { GeneratedContent } from "./preMatch";

export interface PostMatchInput {
  clubName: string;
  isHome: boolean;
  homeTeamName: string;
  homeTeamApiId: number;
  awayTeamName: string;
  awayTeamApiId: number;
  leagueName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  statusLong: string;
  statistics: ApiFixtureStatistic[];
  events: ApiFixtureEvent[];
}

const STAT_ROWS: { type: string; label: string }[] = [
  { type: "Ball Possession", label: "Posse de bola" },
  { type: "Total Shots", label: "Finalizações" },
  { type: "Shots on Goal", label: "Finalizações no gol" },
  { type: "Corner Kicks", label: "Escanteios" },
  { type: "Fouls", label: "Faltas" },
  { type: "Offsides", label: "Impedimentos" },
  { type: "Yellow Cards", label: "Cartões amarelos" },
  { type: "Red Cards", label: "Cartões vermelhos" },
  { type: "Passes %", label: "Precisão de passe" },
];

export function buildPostMatchContent(input: PostMatchInput): GeneratedContent {
  const home = input.homeGoals ?? 0;
  const away = input.awayGoals ?? 0;
  const title = `Pós-jogo: ${input.homeTeamName} ${home} x ${away} ${input.awayTeamName}`;

  const clubGoals = input.isHome ? home : away;
  const opponentGoals = input.isHome ? away : home;
  const result = resultLabel(clubGoals, opponentGoals);

  const homeStats = input.statistics.find((s) => s.team.id === input.homeTeamApiId)?.statistics;
  const awayStats = input.statistics.find((s) => s.team.id === input.awayTeamApiId)?.statistics;

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`**${input.leagueName}** — ${input.statusLong}.`);
  lines.push("");
  lines.push(
    `Resultado final: **${input.homeTeamName} ${home} x ${away} ${input.awayTeamName}**. ${input.clubName} sai de campo com uma **${result}**.`
  );

  const goals = input.events.filter((e) => e.type === "Goal");
  if (goals.length) {
    lines.push("");
    lines.push("## Gols da partida");
    for (const g of goals) {
      lines.push(
        `- ${minuteLabel(g.time.elapsed, g.time.extra)} ${g.team.name}: ${g.player.name ?? "gol"}${g.assist.name ? ` (assist. ${g.assist.name})` : ""}${g.detail ? ` — ${g.detail}` : ""}`
      );
    }
  }

  const cards = input.events.filter((e) => e.type === "Card");
  if (cards.length) {
    lines.push("");
    lines.push("## Cartões");
    for (const c of cards) {
      lines.push(`- ${minuteLabel(c.time.elapsed, c.time.extra)} ${c.team.name}: ${c.detail} para ${c.player.name ?? "-"}`);
    }
  }

  const subs = input.events.filter((e) => e.type === "subst");
  if (subs.length) {
    lines.push("");
    lines.push("## Substituições");
    for (const s of subs) {
      lines.push(`- ${minuteLabel(s.time.elapsed, s.time.extra)} ${s.team.name}: entra ${s.assist.name ?? "-"}, sai ${s.player.name ?? "-"}`);
    }
  }

  if (homeStats || awayStats) {
    lines.push("");
    lines.push("## Estatísticas finais");
    lines.push(`| Estatística | ${input.homeTeamName} | ${input.awayTeamName} |`);
    lines.push("|---|---|---|");
    for (const row of STAT_ROWS) {
      lines.push(`| ${row.label} | ${statValue(homeStats, row.type)} | ${statValue(awayStats, row.type)} |`);
    }
  }

  return {
    title,
    body: lines.join("\n"),
    data: { statistics: input.statistics, events: input.events, result },
  };
}
