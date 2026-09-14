import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FixtureStatusBadge, ContentStatusBadge } from "@/components/StatusBadge";
import { ContentBody } from "@/components/ContentBody";
import { GenerateButton } from "@/components/GenerateButton";

export const dynamic = "force-dynamic";

function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STAGES: { stage: "PRE" | "HALFTIME" | "POST"; label: string; button: string }[] = [
  { stage: "PRE", label: "Pré-jogo", button: "Gerar pré-jogo" },
  { stage: "HALFTIME", label: "Intervalo", button: "Gerar intervalo" },
  { stage: "POST", label: "Pós-jogo", button: "Gerar pós-jogo" },
];

export default async function FixtureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: { club: true, contents: true },
  });

  if (!fixture) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/clubes/${fixture.club.slug}`} className="text-xs text-neutral-500 hover:text-neutral-300">
          ← {fixture.club.name}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold">
            {fixture.homeTeamName}{" "}
            {fixture.homeGoals !== null ? `${fixture.homeGoals} x ${fixture.awayGoals}` : "x"}{" "}
            {fixture.awayTeamName}
          </h1>
          <FixtureStatusBadge status={fixture.status} />
        </div>
        <p className="text-sm text-neutral-500">
          {fixture.leagueName}
          {fixture.round ? ` · ${fixture.round}` : ""} · {formatKickoff(fixture.kickoff)}
          {fixture.venueName ? ` · ${fixture.venueName}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {STAGES.map(({ stage, label, button }) => {
          const content = fixture.contents.find((c) => c.stage === stage);
          return (
            <section key={stage} className="rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-sm">{label}</h2>
                  {content && <ContentStatusBadge status={content.status} />}
                </div>
                <GenerateButton fixtureId={fixture.id} stage={stage} label={content?.body ? "Regenerar" : button} />
              </div>
              <div className="px-4 py-4">
                {content?.body ? (
                  <ContentBody body={content.body} />
                ) : content?.error ? (
                  <p className="text-sm text-red-400">Erro na última geração: {content.error}</p>
                ) : (
                  <p className="text-sm text-neutral-500">Conteúdo ainda não gerado.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
