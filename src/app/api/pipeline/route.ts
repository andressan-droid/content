import { runContentPipelineCycle } from "@/lib/pipeline";

// Permite disparar manualmente um ciclo do pipeline (útil em ambientes sem o worker rodando,
// por exemplo via um cron externo/serverless que chama este endpoint periodicamente).
export async function POST() {
  const result = await runContentPipelineCycle();
  return Response.json({ ok: true, result });
}
