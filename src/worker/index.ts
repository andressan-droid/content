// Worker de agendamento do FutebolCard Auto Content.
//
// Roda como processo separado e contínuo (`npm run worker`), independente do servidor Next.js.
// Responsabilidades:
//  1. A cada SYNC_INTERVAL_MINUTES, sincroniza as próximas partidas de cada clube cliente.
//  2. A cada LIVE_POLL_INTERVAL_MINUTES, verifica partidas na janela "ao vivo" e dispara
//     a geração de conteúdo pré-jogo (dentro da janela configurada), de intervalo (ao detectar HT)
//     e pós-jogo (ao detectar término).
import "dotenv/config";
import cron from "node-cron";
import { syncAllClubs } from "@/lib/sync";
import { runContentPipelineCycle } from "@/lib/pipeline";

const SYNC_INTERVAL_MINUTES = Number(process.env.SYNC_INTERVAL_MINUTES ?? 60);
const LIVE_POLL_INTERVAL_MINUTES = Number(process.env.LIVE_POLL_INTERVAL_MINUTES ?? 2);

function log(msg: string) {
  console.log(`[worker ${new Date().toISOString()}] ${msg}`);
}

async function runSync() {
  log("sincronizando calendário de partidas...");
  try {
    const results = await syncAllClubs();
    const total = results.reduce((acc, r) => acc + r.fixtures, 0);
    log(`sincronização concluída: ${total} partidas atualizadas em ${results.length} clubes.`);
  } catch (err) {
    log(`erro na sincronização: ${err instanceof Error ? err.message : err}`);
  }
}

async function runPipeline() {
  try {
    const result = await runContentPipelineCycle();
    if (result.pre || result.halftime || result.finished) {
      log(
        `conteúdo gerado — pré-jogo: ${result.pre}, intervalo: ${result.halftime}, pós-jogo: ${result.finished} (checadas: ${result.checked})`
      );
    }
  } catch (err) {
    log(`erro no ciclo de conteúdo: ${err instanceof Error ? err.message : err}`);
  }
}

async function main() {
  log("worker iniciado.");
  log(`sync a cada ${SYNC_INTERVAL_MINUTES}min | poll ao vivo a cada ${LIVE_POLL_INTERVAL_MINUTES}min`);

  await runSync();
  await runPipeline();

  cron.schedule(`*/${SYNC_INTERVAL_MINUTES} * * * *`, runSync);
  cron.schedule(`*/${LIVE_POLL_INTERVAL_MINUTES} * * * *`, runPipeline);
}

main().catch((err) => {
  console.error("[worker] erro fatal:", err);
  process.exit(1);
});
