// Utilitários de formatação compartilhados pelos geradores de conteúdo.

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Converte "WWDLW" (mais recente por último, padrão API-Football) em "V-V-E-D-V"
// exibindo do jogo mais recente para o mais antigo.
export function formatForm(form: string | null | undefined, lastN = 5): string {
  if (!form) return "sem dados recentes";
  const letters = form.slice(-lastN).split("").reverse();
  const map: Record<string, string> = { W: "V", D: "E", L: "D" };
  return letters.map((l) => map[l] ?? l).join("-");
}

export function pct(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const s = String(value);
  return s.endsWith("%") ? s : `${s}%`;
}

export function statValue(
  stats: { type: string; value: string | number | null }[] | undefined,
  type: string
): string {
  const found = stats?.find((s) => s.type === type);
  if (!found || found.value === null || found.value === undefined) return "0";
  return String(found.value);
}

export function resultLabel(clientGoals: number, opponentGoals: number): "vitória" | "empate" | "derrota" {
  if (clientGoals > opponentGoals) return "vitória";
  if (clientGoals < opponentGoals) return "derrota";
  return "empate";
}

export function minuteLabel(elapsed: number, extra: number | null): string {
  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
}
