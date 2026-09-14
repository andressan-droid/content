import type { ApiFixtureEvent, ApiFixtureStatistic } from "@/lib/apiFootball";
import { minuteLabel, statValue } from "./helpers";
import type { GeneratedContent } from "./preMatch";

export interface HalftimeInput {
  clubName: string;
  homeTeamName: string;
  homeTeamApiId: number;
  awayTeamName: string;
  awayTeamApiId: number;
  leagueName: string;
  homeGoalsHT: number | null;
  awayGoalsHT: number | null;
  statistics: ApiFixtureStatistic[];
  events: ApiFixtureEvent[];
}

const STAT_ROWS: { type: string; label: string }[] = [
  { type: "Ball Possession", label: "Posse de bola" },
  { type: "Total Shots", label: "Finalizações" },
  { type: "Shots on Goal", label: "Finalizações no gol" },
  { type: "Corner Kicks", label: "Escanteios" },
  { type: "Fouls", label: "Faltas" },
  { type: "Yellow Cards", label: "Cartões amarelos" },
  { type: "Red Cards", label: "Cartões vermelhos" },
];

export function buildHalftimeContent(input: HalftimeInput): GeneratedContent {
  const title = `Intervalo: ${input.homeTeamName} ${input.homeGoalsHT ?? 0} x ${input.awayGoalsHT ?? 0} ${input.awayTeamName}`;

  const homeStats = input.statistics.find((s) => s.team.id === input.homeTeamApiId)?.statistics;
  const awayStats = input.statistics.find((s) => s.team.id === input.awayTeamApiId)?.statistics;

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`**${input.leagueName}** — fim do primeiro tempo.`);
  lines.push("");
  lines.push(
    `Placar parcial: **${input.homeTeamName} ${input.homeGoalsHT ?? 0} x ${input.awayGoalsHT ?? 0} ${input.awayTeamName}**`
  );

  const firstHalfEvents = input.events.filter((e) => e.time.elapsed <= 45);
  const goals = firstHalfEvents.filter((e) => e.type === "Goal");
  if (goals.length) {
    lines.push("");
    lines.push("## Gols do primeiro tempo");
    for (const g of goals) {
      lines.push(
        `- ${minuteLabel(g.time.elapsed, g.time.extra)} ${g.team.name}: ${g.player.name ?? "gol"}${g.detail ? ` (${g.detail})` : ""}`
      );
    }
  }

  const cards = firstHalfEvents.filter((e) => e.type === "Card");
  if (cards.length) {
    lines.push("");
    lines.push("## Cartões");
    for (const c of cards) {
      lines.push(`- ${minuteLabel(c.time.elapsed, c.time.extra)} ${c.team.name}: ${c.detail} para ${c.player.name ?? "-"}`);
    }
  }

  if (homeStats || awayStats) {
    lines.push("");
    lines.push("## Estatísticas do 1º tempo");
    lines.push(`| Estatística | ${input.homeTeamName} | ${input.awayTeamName} |`);
    lines.push("|---|---|---|");
    for (const row of STAT_ROWS) {
      lines.push(`| ${row.label} | ${statValue(homeStats, row.type)} | ${statValue(awayStats, row.type)} |`);
    }
  }

  lines.push("");
  lines.push(`${input.clubName} vai para o intervalo do jogo contra o adversário direto na competição.`);

  return {
    title,
    body: lines.join("\n"),
    data: { statistics: input.statistics, events: firstHalfEvents },
  };
}
