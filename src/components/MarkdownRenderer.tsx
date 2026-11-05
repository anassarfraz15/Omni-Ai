import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

type Block =
  | { type: 'code'; language: string; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'paragraph'; text: string };

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-neutral-200 selection:bg-neutral-800">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'code':
            return <CodeBlock key={idx} language={block.language} code={block.text} />;
          case 'heading': {
            const Tag = `h${Math.min(block.level + 1, 4)}` as keyof React.JSX.IntrinsicElements;
            const sizeClasses =
              block.level === 1
                ? 'text-lg font-bold text-neutral-100 tracking-tight mt-4 mb-2'
                : block.level === 2
                ? 'text-base font-semibold text-neutral-100 mt-3 mb-1.5'
                : 'text-sm font-semibold text-neutral-200 mt-2 mb-1';
            return (
              <Tag key={idx} className={sizeClasses}>
                <InlineText text={block.text} />
              </Tag>
            );
          }
          case 'table':
            return <TableBlock key={idx} headers={block.headers} rows={block.rows} />;
          case 'list':
            return (
              <ul key={idx} className="space-y-1 my-2 ml-4 list-disc marker:text-neutral-500">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-neutral-300">
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote key={idx} className="border-l-2 border-neutral-700 pl-3 my-2 text-neutral-400 italic">
                <InlineText text={block.text} />
              </blockquote>
            );
          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-neutral-300 whitespace-pre-wrap">
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
};

// -------------------------------------------------------------
// Code Block with 1-click Copy
// -------------------------------------------------------------
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/90 shadow-sm font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-neutral-400 select-none">
        <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-400">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-neutral-200 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// -------------------------------------------------------------
// Markdown Table Renderer
// -------------------------------------------------------------
const TableBlock: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-neutral-900 text-neutral-200 border-b border-neutral-800 font-medium">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 border-r border-neutral-800 last:border-r-0">
                <InlineText text={h.trim()} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 border-r border-neutral-800/40 last:border-r-0 text-neutral-300">
                  <InlineText text={cell.trim()} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// -------------------------------------------------------------
// Inline Text Formatter (Bold, Inline Code, Links, Math)
// -------------------------------------------------------------
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let keyCounter = 0;

  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyCounter++}
          className="px-1.5 py-0.5 rounded bg-neutral-900 text-amber-300 border border-neutral-800 font-mono text-[12px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyCounter++} className="font-semibold text-neutral-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={keyCounter++} className="italic text-neutral-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={keyCounter++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
};

// -------------------------------------------------------------
// Markdown Parser
// -------------------------------------------------------------
function parseMarkdownBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        language,
        text: codeLines.join('\n'),
      });
      i++;
      continue;
    }

    // Heading check (#, ##, ###)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote check
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteLines.join(' '),
      });
      continue;
    }

    // Table check (pipe line followed by divider line)
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
      const headers = line.split('|').map((s) => s.trim()).filter(Boolean);
      i += 2; // skip header and divider
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map((s) => s.trim()).filter(Boolean);
        if (cells.length > 0) {
          rows.push(cells);
        }
        i++;
      }
      blocks.push({
        type: 'table',
        headers,
        rows,
      });
      continue;
    }

    // List item check (bullet or number)
    if (line.match(/^(\*|-|\d+\.)\s+(.+)$/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^(\*|-|\d+\.)\s+(.+)$/)) {
        const itemMatch = lines[i].match(/^(\*|-|\d+\.)\s+(.+)$/);
        if (itemMatch) {
          listItems.push(itemMatch[2]);
        }
        i++;
      }
      blocks.push({
        type: 'list',
        items: listItems,
      });
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    const pLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,4}\s/) &&
      !lines[i].startsWith('>') &&
      !lines[i].match(/^(\*|-|\d+\.)\s/) &&
      !lines[i].includes('|')
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      text: pLines.join('\n'),
    });
  }

  return blocks;
}
