import { GenerateCopyButton } from "./GenerateCopyButton";
import { ContentStatusBadge } from "./StatusBadge";

interface CopyLike {
  channel: string;
  status: string;
  subject: string | null;
  body: string | null;
  error: string | null;
}

const CHANNELS: { channel: "SOCIAL" | "EMAIL" | "NEWS"; label: string }[] = [
  { channel: "SOCIAL", label: "Redes sociais" },
  { channel: "EMAIL", label: "E-mail marketing" },
  { channel: "NEWS", label: "Notícia (portal)" },
];

export function CopyPanel({ contentId, copies }: { contentId: string; copies: CopyLike[] }) {
  return (
    <div className="mt-4 border-t border-neutral-800 pt-4">
      <h3 className="text-xs font-medium text-neutral-400 mb-3">Copy gerada por IA (a partir dos dados acima)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CHANNELS.map(({ channel, label }) => {
          const copy = copies.find((c) => c.channel === channel);
          return (
            <div key={channel} className="rounded-md border border-neutral-800 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300">{label}</span>
                {copy && <ContentStatusBadge status={copy.status} />}
              </div>
              <GenerateCopyButton
                contentId={contentId}
                channel={channel}
                label={copy?.body ? "Regenerar" : "Gerar"}
              />
              {copy?.body ? (
                <div className="text-xs text-neutral-300 whitespace-pre-wrap">
                  {copy.subject && <p className="font-semibold mb-1 text-neutral-100">{copy.subject}</p>}
                  {copy.body}
                </div>
              ) : copy?.error ? (
                <p className="text-xs text-red-400">{copy.error}</p>
              ) : (
                <p className="text-xs text-neutral-600">Ainda não gerada.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
