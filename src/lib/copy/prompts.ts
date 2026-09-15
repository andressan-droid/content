import type { CopyChannel } from "@/generated/prisma/enums";
import type { ContentStage } from "@/generated/prisma/enums";

const STAGE_LABEL: Record<ContentStage, string> = {
  PRE: "pré-jogo (antes da partida começar)",
  HALFTIME: "intervalo (fim do 1º tempo, partida em andamento)",
  POST: "pós-jogo (partida encerrada)",
};

const CHANNEL_INSTRUCTIONS: Record<CopyChannel, string> = {
  SOCIAL: `Escreva um POST PARA REDES SOCIAIS (estilo Instagram/Twitter) sobre a partida, do ponto de vista torcedor do clube cliente.
- Curto (no máximo ~500 caracteres), direto, envolvente.
- Pode usar emojis com moderação e 3 a 5 hashtags relevantes ao final (nome do clube, competição).
- Tom vibrante, de torcida, mas sem inventar fatos.
- Responda APENAS com o texto do post, nada mais (sem títulos, sem explicações).`,
  EMAIL: `Escreva um E-MAIL MARKETING sobre a partida, para a base de torcedores/clientes do clube.
- Tom próximo, engajador, com uma chamada para ação clara ao final (ex: acompanhar a partida, ver mais no app/site do clube).
- Responda EXATAMENTE neste formato, sem nada antes ou depois:
ASSUNTO: <linha única com o assunto do e-mail, chamativo, até 60 caracteres>
---
<corpo do e-mail em 2 a 4 parágrafos curtos>`,
  NEWS: `Escreva uma NOTÍCIA PARA PORTAL ESPORTIVO sobre a partida, em texto jornalístico.
- Terceira pessoa, tom informativo e objetivo, mas fluido.
- Comece com um lide (primeiro parágrafo) que resuma o essencial.
- Desenvolva com os dados fornecidos (estatísticas, gols, contexto).
- Responda EXATAMENTE neste formato, sem nada antes ou depois:
TÍTULO: <manchete da notícia, até 90 caracteres>
---
<corpo da notícia em 3 a 5 parágrafos>`,
  TWEET: `Escreva um POST PARA X (TWITTER) sobre a partida.
- Regra inegociável: o texto TODO (incluindo espaços, emojis e hashtags) deve ter NO MÁXIMO
  280 caracteres. Conte os caracteres antes de responder e corte o que for preciso para caber.
- Direto, impactante, pode usar 1 a 2 emojis e até 2 hashtags curtas se couber no limite.
- Tom vibrante de torcida, mas sem inventar fatos.
- Responda APENAS com o texto do post, nada mais (sem títulos, sem explicações, sem contagem de caracteres).`,
  REELS: `Escreva um ROTEIRO FALADO para gravação de um vídeo curto (Reels/TikTok/Shorts) sobre a partida,
para um apresentador/torcedor do clube narrar em frente à câmera.
- Duração alvo: 30 a 45 segundos de fala (aproximadamente 80 a 120 palavras no total).
- Comece com um gancho forte nos primeiros segundos (uma frase de impacto que prenda a atenção).
- Escreva em frases curtas e faladas (como se alguém estivesse falando naturalmente, não lendo um texto formal).
- Estruture em falas numeradas, cada uma indicando o trecho a ser dito; opcionalmente inclua uma
  indicação de cena entre colchetes antes de cada fala (ex.: [closeup, animado]), mas o foco é o texto falado.
- Termine com uma chamada rápida (ex.: comentar, seguir o clube, compartilhar).
- Responda EXATAMENTE neste formato, sem nada antes ou depois:
ROTEIRO:
1. [indicação de cena opcional] Fala 1
2. [indicação de cena opcional] Fala 2
(continue numerando até o fim)`,
};

export const COPY_SYSTEM_PROMPT = `Você é o redator oficial de conteúdo esportivo da FutebolCard, escrevendo para os clubes de futebol clientes.

Regra mais importante: use APENAS os dados fornecidos abaixo sobre a partida. Nunca invente placares, estatísticas, nomes de jogadores, datas ou qualquer outro fato que não esteja nos dados. Se um dado não estiver disponível, simplesmente não o mencione — não estime nem suponha.

Escreva em português do Brasil, sem erros gramaticais, em um tom profissional mas envolvente, adequado a conteúdo esportivo.`;

export function buildCopyUserPrompt(params: {
  channel: CopyChannel;
  stage: ContentStage;
  clubName: string;
  contentTitle: string | null;
  contentBody: string;
}): string {
  const { channel, stage, clubName, contentTitle, contentBody } = params;
  return `Clube cliente: ${clubName}
Momento da partida: ${STAGE_LABEL[stage]}

Dados reais da partida (já apurados a partir da API-Football):
"""
${contentTitle ? `${contentTitle}\n` : ""}${contentBody}
"""

Tarefa:
${CHANNEL_INSTRUCTIONS[channel]}`;
}
