// Clubes clientes da FutebolCard.
// `apiSearch` é o termo usado para resolver o time na API-Football (GET /teams?search=...)
// na primeira sincronização. O id retornado é então cacheado em Club.apiFootballId.

export interface ClubSeed {
  name: string;
  shortName: string;
  slug: string;
  apiSearch: string;
}

export const CLUB_SEEDS: ClubSeed[] = [
  { name: "Flamengo", shortName: "FLA", slug: "flamengo", apiSearch: "Flamengo" },
  { name: "Fluminense", shortName: "FLU", slug: "fluminense", apiSearch: "Fluminense" },
  { name: "Red Bull Bragantino", shortName: "RBB", slug: "red-bull-bragantino", apiSearch: "Bragantino" },
  { name: "Ponte Preta", shortName: "PON", slug: "ponte-preta", apiSearch: "Ponte Preta" },
  { name: "Náutico", shortName: "NAU", slug: "nautico", apiSearch: "Nautico" },
  { name: "ABC", shortName: "ABC", slug: "abc", apiSearch: "ABC" },
  { name: "Sampaio Corrêa", shortName: "SAM", slug: "sampaio-correa", apiSearch: "Sampaio Correa" },
  { name: "Paraná Clube", shortName: "PAR", slug: "parana-clube", apiSearch: "Parana Clube" },
  { name: "Avaí", shortName: "AVA", slug: "avai", apiSearch: "Avai" },
  { name: "Coritiba", shortName: "COR", slug: "coritiba", apiSearch: "Coritiba" },
  { name: "Operário Ferroviário", shortName: "OPE", slug: "operario-ferroviario", apiSearch: "Operario PR" },
  { name: "Confiança", shortName: "CSE", slug: "confianca", apiSearch: "Confianca" },
  { name: "CSA", shortName: "CSA", slug: "csa", apiSearch: "CSA" },
  { name: "América-RN", shortName: "AME", slug: "america-rn", apiSearch: "America RN" },
  { name: "Santa Cruz", shortName: "SCR", slug: "santa-cruz", apiSearch: "Santa Cruz" },
  { name: "Sergipe", shortName: "SER", slug: "sergipe", apiSearch: "Sergipe" },
  { name: "Retrô", shortName: "RET", slug: "retro", apiSearch: "Retro" },
  { name: "Juventus-SP", shortName: "JUV", slug: "juventus-sp", apiSearch: "Juventus" },
  { name: "Joinville", shortName: "JEC", slug: "joinville", apiSearch: "Joinville" },
];
