"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateCopyButton({
  contentId,
  channel,
  label,
}: {
  contentId: string;
  channel: "SOCIAL" | "EMAIL" | "NEWS" | "TWEET" | "REELS";
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/content/${contentId}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Falha ao gerar copy");
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
        className="rounded-md bg-indigo-900/60 hover:bg-indigo-800/60 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-indigo-200 border border-indigo-800"
      >
        {loading ? "Gerando..." : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
