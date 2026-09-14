import Link from "next/link";
import { prisma } from "@/lib/db";
import { FixtureStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function ClubesPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          fixtures: { where: { status: { in: [FixtureStatus.SCHEDULED, FixtureStatus.LIVE, FixtureStatus.HALFTIME] } } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Clubes clientes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/clubes/${club.slug}`}
            className="rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors flex flex-col gap-1"
          >
            <span className="font-medium">{club.name}</span>
            <span className="text-xs text-neutral-500">
              {club._count.fixtures} partida(s) na janela ativa
            </span>
            {!club.apiFootballId && (
              <span className="text-xs text-amber-400">ID da API-Football ainda não resolvido</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
