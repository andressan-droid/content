import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FixtureStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      fixtures: {
        include: { contents: true },
        orderBy: { kickoff: "desc" },
        take: 30,
      },
    },
  });

  if (!club) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/clubes" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Clubes
        </Link>
        <h1 className="text-xl font-semibold">{club.name}</h1>
        <p className="text-sm text-neutral-500">
          {club.apiFootballId ? `API-Football ID: ${club.apiFootballId}` : "ID da API-Football ainda não resolvido — sincronize para resolver."}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-800">
        {club.fixtures.length === 0 && (
          <div className="px-4 py-6 text-sm text-neutral-500">Nenhuma partida sincronizada para este clube ainda.</div>
        )}
        {club.fixtures.map((fx) => (
          <Link
            key={fx.id}
            href={`/partidas/${fx.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-900 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {fx.homeTeamName} x {fx.awayTeamName}
              </div>
              <div className="text-xs text-neutral-500">
                {fx.leagueName} · {formatKickoff(fx.kickoff)}
              </div>
            </div>
            <FixtureStatusBadge status={fx.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
