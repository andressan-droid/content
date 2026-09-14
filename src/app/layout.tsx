import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutebolCard — Conteúdo Automático",
  description: "Geração automática de conteúdo pré-jogo, intervalo e pós-jogo dos clubes clientes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 bg-neutral-900">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              ⚽ FutebolCard <span className="text-neutral-500 font-normal">Auto Content</span>
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-300">
              <Link href="/" className="hover:text-white">Painel</Link>
              <Link href="/clubes" className="hover:text-white">Clubes</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
          Conteúdo gerado automaticamente a partir de dados da API-Football.
        </footer>
      </body>
    </html>
  );
}
