# FutebolCard — Auto Content

Aplicativo interno da FutebolCard que gera automaticamente conteúdo de **pré-jogo**,
**intervalo** e **pós-jogo** para cada partida dos clubes clientes, com estatísticas,
probabilidades/odds e resultado, a partir de dados da [API-Football](https://www.api-football.com/).
A partir desse conteúdo base, é possível gerar com IA (Claude) **copy pronta para redes
sociais, e-mail marketing e notícia de portal** — sempre a partir dos dados reais já
apurados, nunca inventados pela IA.

## Clubes acompanhados

Flamengo, Fluminense, Red Bull Bragantino, Ponte Preta, Náutico, ABC, Sampaio Corrêa,
Paraná Clube, Avaí, Coritiba, Operário Ferroviário, Confiança, CSA, América-RN, Santa Cruz,
Sergipe e Retrô (definidos em `src/lib/clubs.ts`).

## Arquitetura

```
src/
  lib/
    apiFootball.ts     # cliente HTTP fino para a API-Football
    fixtureStatus.ts   # mapeamento de status da API -> status interno
    sync.ts             # resolve times na API e sincroniza o calendário de partidas
    pipeline.ts          # decide o que gerar (pré/intervalo/pós) e quando
    content/
      preMatch.ts        # monta o texto de pré-jogo (probabilidades, odds, retrospecto, forma)
      halftime.ts         # monta o texto do intervalo (placar parcial, estatísticas do 1ºT, eventos)
      postMatch.ts         # monta o texto do pós-jogo (resultado, estatísticas finais, gols/cartões)
      generate.ts           # orquestra: busca dados na API, chama o builder certo, salva no banco
    copy/
      prompts.ts             # instruções de sistema/usuário por canal (social/e-mail/notícia)
      anthropic.ts            # client da API da Claude
      generate.ts              # gera a copy de um canal a partir de um Content já gerado
  worker/index.ts       # processo contínuo (cron) que roda a sincronização e o pipeline
  app/                   # dashboard Next.js (App Router)
    page.tsx               # painel: próximas partidas / ao vivo, com status de cada conteúdo
    clubes/                 # lista de clubes e detalhe por clube
    partidas/[id]/           # detalhe da partida com os 3 conteúdos, copies por canal e botões
    api/
      sync/                   # POST — sincroniza o calendário de todos os clubes
      pipeline/                # POST — roda um ciclo do pipeline (útil sem o worker rodando)
      fixtures/[id]/generate/   # POST { stage: PRE|HALFTIME|POST } — gera/regenera manualmente
      content/[id]/copy/        # POST { channel: SOCIAL|EMAIL|NEWS } — gera/regenera a copy
prisma/
  schema.prisma           # modelos: Club, Fixture, Content, Copy
  seed.ts                   # popula os 17 clubes clientes
```

**Banco de dados:** SQLite via Prisma (`prisma/schema.prisma`), suficiente para uso interno.
Para produção com mais concorrência, troque o `datasource` para PostgreSQL/MySQL — o restante
do código não muda (Prisma Client abstrai o driver).

**Modelo de dados:**
- `Club` — os 17 clubes clientes, com o `apiFootballId` resolvido automaticamente na primeira sincronização.
- `Fixture` — uma partida de um clube cliente (mandante ou visitante), com placar, status e metadados.
- `Content` — um conteúdo gerado por `(Fixture, stage)`, `stage` ∈ `PRE | HALFTIME | POST`, com o texto
  final (`body`, em markdown simples), o `dataJson` usado para montá-lo (auditoria) e o status
  (`PENDING | GENERATED | FAILED | PUBLISHED`).
- `Copy` — uma copy gerada por IA por `(Content, channel)`, `channel` ∈ `SOCIAL | EMAIL | NEWS`,
  usando o `Content.body` (dados reais já apurados) como base enviada à Claude — a IA só redige
  em cima desses dados, nunca inventa números/fatos novos.

## Como a automação decide o que gerar

O `worker` roda dois ciclos em paralelo (`src/worker/index.ts`):

1. **Sincronização de calendário** (a cada `SYNC_INTERVAL_MINUTES`, padrão 60min): busca as próximas
   partidas de cada clube na API-Football e faz upsert no banco.
2. **Pipeline de conteúdo** (a cada `LIVE_POLL_INTERVAL_MINUTES`, padrão 2min):
   - Gera o **pré-jogo** para toda partida agendada cujo apito inicial está a até `PRE_LEAD_HOURS`
     (padrão 6h) de distância e que ainda não tem conteúdo gerado.
   - Atualiza o status/placar das partidas na "janela ao vivo" (começaram há até 4h ou começam nos
     próximos 15min) com uma única chamada em lote à API.
   - Ao detectar status `HALFTIME`, gera o **conteúdo de intervalo**.
   - Ao detectar status `FINISHED`, gera o **conteúdo de pós-jogo**.

Cada estágio só é gerado uma vez automaticamente (idempotente via `Content.status = GENERATED`),
mas pode ser **regenerado manualmente** a qualquer momento pelo botão na página da partida — útil
para corrigir um conteúdo específico ou testar antes de uma partida real acontecer.

## Configuração

1. Copie `.env.example` para `.env` e preencha:
   - `API_FOOTBALL_KEY` — sua chave da API-Football (plano direto api-sports.io ou RapidAPI).
   - `API_FOOTBALL_USE_RAPIDAPI="true"` se a chave for do plano RapidAPI.
   - `ANTHROPIC_API_KEY` — sua chave da API da Claude ([console.anthropic.com](https://console.anthropic.com/)),
     necessária só para o botão de gerar copy (redes sociais/e-mail/notícia). Sem ela, o resto do
     app funciona normalmente.
   - `SYNC_SEASON` — deixe em branco para usar a temporada atual; defina um ano específico (ex: `2024`)
     se seu plano da API-Football não tiver acesso à temporada corrente (a mensagem de erro no
     terminal informa quais anos seu plano libera).
   - Ajuste `PRE_LEAD_HOURS`, `SYNC_INTERVAL_MINUTES`, `LIVE_POLL_INTERVAL_MINUTES` conforme a
     necessidade (respeitando o limite diário/por minuto de chamadas do seu plano na API-Football —
     o app já espaça as chamadas automaticamente para respeitar limites por minuto).

2. Instale as dependências e prepare o banco:
   ```bash
   npm install
   npm run db:migrate   # cria/atualiza o banco SQLite local
   npm run db:seed        # popula os 17 clubes clientes
   ```

3. Rode o dashboard:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`, vá em **Painel** e clique em **"Sincronizar partidas agora"**
   para buscar o calendário pela primeira vez (isso também resolve o ID de cada clube na API-Football).

4. Rode o worker de agendamento (processo separado, mantenha rodando continuamente em produção,
   por exemplo via `pm2` ou um serviço `systemd`):
   ```bash
   npm run worker
   ```

   Alternativa sem processo contínuo: chame `POST /api/pipeline` e `POST /api/sync` a partir de um
   cron externo (ex.: cron job do servidor, GitHub Actions agendado, etc.).

## Uso manual

Na página de cada partida (`/partidas/[id]`) há um botão **Gerar/Regenerar** para cada um dos três
estágios — útil para gerar conteúdo sob demanda sem esperar a janela automática, ou para corrigir um
conteúdo após uma falha (erros de chamada à API-Football ficam registrados e visíveis na tela, com o
estágio marcado como `FAILED`).

## Copy para redes sociais, e-mail e notícia

Em cada conteúdo já gerado (pré-jogo, intervalo ou pós-jogo), a página da partida mostra três
cartões — **Redes sociais**, **E-mail marketing** e **Notícia (portal)** — cada um com um botão
**Gerar**. Ao clicar, o app envia o texto/dados já apurados daquele estágio para a Claude com uma
instrução específica do canal (post curto com hashtags, e-mail com assunto + CTA, ou notícia em
formato jornalístico) e salva o resultado. A Claude é instruída a **usar apenas os dados fornecidos**
— ela redige, não inventa placar/estatística/fato novo. Requer `ANTHROPIC_API_KEY` configurada.

## Limites da API-Football

O plano gratuito da API-Football tem limite de ~100 requisições/dia. Os intervalos padrão deste
projeto (`SYNC_INTERVAL_MINUTES=60`, `LIVE_POLL_INTERVAL_MINUTES=2`) foram escolhidos para um uso
razoável em planos pagos; em planos com limite mais apertado, aumente os intervalos no `.env`.
