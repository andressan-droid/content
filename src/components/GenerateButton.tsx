"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateButton({ fixtureId, stage, label }: { fixtureId: string; stage: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fixtures/${fixtureId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Falha ao gerar conteúdo");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-neutral-100 border border-neutral-700"
      >
        {loading ? "Gerando..." : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
