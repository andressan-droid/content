"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error("Falha na sincronização");
      const total = (json.results as { fixtures: number }[]).reduce((a, r) => a + r.fixtures, 0);
      setMessage(`${total} partidas sincronizadas.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white"
      >
        {loading ? "Sincronizando..." : "Sincronizar partidas agora"}
      </button>
      {message && <span className="text-xs text-neutral-400">{message}</span>}
    </div>
  );
}
