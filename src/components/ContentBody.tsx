// Renderizador minimalista para o subconjunto de markdown usado pelos geradores de conteúdo
// (#, ##, listas com "-", tabelas "|", **negrito**). Evita depender de uma lib externa.

import type { ReactNode } from "react";

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function ContentBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, idx)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(<h1 key={`h-${key++}`}>{line.slice(2)}</h1>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(<h2 key={`h-${key++}`}>{line.slice(3)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      flushList();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((l) => !/^\|[\s-]*\|[\s-:|]*$/.test(l))
        .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
      const [header, ...bodyRows] = rows;
      blocks.push(
        <table key={`t-${key++}`}>
          <thead>
            <tr>
              {header?.map((cell, idx) => <th key={idx}>{cell}</th>)}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ridx) => (
              <tr key={ridx}>
                {row.map((cell, cidx) => <td key={cidx}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }
    if (line.trim() === "") {
      flushList();
      i++;
      continue;
    }

    flushList();
    blocks.push(<p key={`p-${key++}`}>{renderInline(line, 0)}</p>);
    i++;
  }
  flushList();

  return <div className="prose-content">{blocks}</div>;
}
