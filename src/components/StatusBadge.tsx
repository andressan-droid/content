const FIXTURE_LABELS: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Agendada", className: "bg-neutral-800 text-neutral-300" },
  LIVE: { label: "Ao vivo", className: "bg-red-900/60 text-red-300" },
  HALFTIME: { label: "Intervalo", className: "bg-amber-900/60 text-amber-300" },
  FINISHED: { label: "Encerrada", className: "bg-emerald-900/60 text-emerald-300" },
  POSTPONED: { label: "Adiada", className: "bg-neutral-800 text-neutral-400" },
  CANCELLED: { label: "Cancelada", className: "bg-neutral-800 text-neutral-500" },
};

const CONTENT_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-neutral-800 text-neutral-400" },
  GENERATED: { label: "Gerado", className: "bg-emerald-900/60 text-emerald-300" },
  FAILED: { label: "Falhou", className: "bg-red-900/60 text-red-300" },
  PUBLISHED: { label: "Publicado", className: "bg-blue-900/60 text-blue-300" },
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function FixtureStatusBadge({ status }: { status: string }) {
  const info = FIXTURE_LABELS[status] ?? { label: status, className: "bg-neutral-800 text-neutral-300" };
  return <Badge {...info} />;
}

export function ContentStatusBadge({ status }: { status: string }) {
  const info = CONTENT_LABELS[status] ?? { label: status, className: "bg-neutral-800 text-neutral-300" };
  return <Badge {...info} />;
}
