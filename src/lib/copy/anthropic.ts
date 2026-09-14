import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic?: Anthropic };

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente com sua chave da API da Claude."
    );
  }
  if (!globalForAnthropic.anthropic) {
    globalForAnthropic.anthropic = new Anthropic();
  }
  return globalForAnthropic.anthropic;
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
