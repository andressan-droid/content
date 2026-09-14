import Link from "next/link";
import { prisma } from "@/lib/db";
import { SyncButton } from "@/components/SyncButton";
import { FixtureStatusBadge } from "@/components/StatusBadge";
import { FixtureStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HomePage() {
  const [clubCount, fixtures, liveCount] = await Promise.all([
    prisma.club.count({ where: { active: true } }),
    prisma.fixture.findMany({
      where: { status: { in: [FixtureStatus.SCHEDULED, FixtureStatus.LIVE, FixtureStatus.HALFTIME] } },
      include: { club: true, contents: true },
      orderBy: { kickoff: "asc" },
      take: 20,
    }),
    prisma.fixture.count({ where: { status: { in: [FixtureStatus.LIVE, FixtureStatus.HALFTIME] } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Painel de conteúdo</h1>
          <p className="text-sm text-neutral-400">
            {clubCount} clubes acompanhados · {liveCount} partida(s) ao vivo agora
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-800">
        <div className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-900">
          Próximas partidas e jogos em andamento
        </div>
        {fixtures.length === 0 && (
          <div className="px-4 py-6 text-sm text-neutral-500">
            Nenhuma partida sincronizada ainda. Configure a chave da API-Football no `.env` e clique em
            &quot;Sincronizar partidas agora&quot;.
          </div>
        )}
        {fixtures.map((fx) => {
          const preOk = fx.contents.some((c) => c.stage === "PRE" && c.status === "GENERATED");
          const htOk = fx.contents.some((c) => c.stage === "HALFTIME" && c.status === "GENERATED");
          const postOk = fx.contents.some((c) => c.stage === "POST" && c.status === "GENERATED");
          return (
            <Link
              key={fx.id}
              href={`/partidas/${fx.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-neutral-500 w-24 shrink-0">{fx.club.shortName}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {fx.homeTeamName} x {fx.awayTeamName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {fx.leagueName} · {formatKickoff(fx.kickoff)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${preOk ? "bg-emerald-900/60 text-emerald-300" : "bg-neutral-800 text-neutral-500"}`}>PRÉ</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${htOk ? "bg-emerald-900/60 text-emerald-300" : "bg-neutral-800 text-neutral-500"}`}>HT</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${postOk ? "bg-emerald-900/60 text-emerald-300" : "bg-neutral-800 text-neutral-500"}`}>PÓS</span>
                <FixtureStatusBadge status={fx.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
