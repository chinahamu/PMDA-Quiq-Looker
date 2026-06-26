import { Fragment, type ReactNode } from 'react';

interface MarkdownContentProps {
  markdown: string;
  className?: string;
}

type MarkdownBlock =
  | { type: 'blockquote'; content: string }
  | { type: 'code'; content: string; language?: string }
  | { type: 'heading'; level: number; content: string }
  | { type: 'hr' }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

const INLINE_TOKEN_PATTERN = /(\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)\s]+\)|`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*|_[^_\n]+?_|https?:\/\/[^\s<>()]+)/g;

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  const blocks = parseMarkdown(markdown);
  const rootClassName = className ? `${className} markdown-content` : 'markdown-content';

  if (blocks.length === 0) {
    return <div className={rootClassName} />;
  }

  return <div className={rootClassName}>{blocks.map((block, index) => renderBlock(block, index))}</div>;
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const codeFenceMatch = trimmedLine.match(/^(`{3,}|~{3,})(.*)$/);
    if (codeFenceMatch) {
      const fence = codeFenceMatch[1][0];
      const language = codeFenceMatch[2].trim() || undefined;
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith(fence.repeat(3))) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({ type: 'code', content: codeLines.join('\n'), language });
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (isThematicBreak(trimmedLine)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];

      while (index < lines.length && isUnorderedListLine(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim());
        index += 1;
      }

      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];

      while (index < lines.length && isOrderedListLine(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+[.)]\s+/, '').trim());
        index += 1;
      }

      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    if (trimmedLine.startsWith('>')) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }

      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: 'paragraph', content: paragraphLines.join('\n') });
  }

  return blocks;
}

function renderBlock(block: MarkdownBlock, index: number): ReactNode {
  const key = `markdown-block-${index}`;

  switch (block.type) {
    case 'blockquote':
      return (
        <blockquote key={key}>
          <MarkdownContent markdown={block.content} />
        </blockquote>
      );
    case 'code':
      return (
        <pre key={key}>
          <code className={block.language ? `language-${block.language}` : undefined}>{block.content}</code>
        </pre>
      );
    case 'heading':
      return renderHeading(block.level, block.content, key);
    case 'hr':
      return <hr key={key} />;
    case 'list':
      return renderList(block, key);
    case 'paragraph':
      return <p key={key}>{renderInline(block.content, key)}</p>;
    case 'table':
      return (
        <div className="markdown-table-wrapper" key={key}>
          <table>
            <thead>
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={`${key}-header-${headerIndex}`}>{renderInline(header, `${key}-header-${headerIndex}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {block.headers.map((_, cellIndex) => (
                    <td key={`${key}-row-${rowIndex}-cell-${cellIndex}`}>
                      {renderInline(row[cellIndex] ?? '', `${key}-row-${rowIndex}-cell-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

function renderHeading(level: number, content: string, key: string): ReactNode {
  const children = renderInline(content, key);

  switch (level) {
    case 1:
      return <h1 key={key}>{children}</h1>;
    case 2:
      return <h2 key={key}>{children}</h2>;
    case 3:
      return <h3 key={key}>{children}</h3>;
    case 4:
      return <h4 key={key}>{children}</h4>;
    case 5:
      return <h5 key={key}>{children}</h5>;
    default:
      return <h6 key={key}>{children}</h6>;
  }
}

function renderList(block: Extract<MarkdownBlock, { type: 'list' }>, key: string): ReactNode {
  const items = block.items.map((item, itemIndex) => (
    <li key={`${key}-item-${itemIndex}`}>{renderInline(item, `${key}-item-${itemIndex}`)}</li>
  ));

  if (block.ordered) {
    return <ol key={key}>{items}</ol>;
  }

  return <ul key={key}>{items}</ul>;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  INLINE_TOKEN_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-inline-${nodes.length}`;

    if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = linkMatch ? toSafeHref(linkMatch[2]) : null;
      nodes.push(
        href ? (
          <a href={href} key={key} rel="noreferrer" target="_blank">
            {linkMatch?.[1] ?? href}
          </a>
        ) : (
          <Fragment key={key}>{token}</Fragment>
        ),
      );
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const href = toSafeHref(token);
      nodes.push(
        href ? (
          <a href={href} key={key} rel="noreferrer" target="_blank">
            {token}
          </a>
        ) : (
          <Fragment key={key}>{token}</Fragment>
        ),
      );
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];
  const trimmedLine = line.trim();

  return (
    /^(`{3,}|~{3,})/.test(trimmedLine) ||
    /^#{1,6}\s+/.test(line) ||
    isThematicBreak(trimmedLine) ||
    isUnorderedListLine(line) ||
    isOrderedListLine(line) ||
    trimmedLine.startsWith('>') ||
    isTableStart(lines, index)
  );
}

function isOrderedListLine(line: string): boolean {
  return /^\s*\d+[.)]\s+/.test(line);
}

function isUnorderedListLine(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line);
}

function isTableStart(lines: string[], index: number): boolean {
  return index + 1 < lines.length && isTableRow(lines[index]) && isTableSeparator(lines[index + 1]);
}

function isTableRow(line: string): boolean {
  const trimmedLine = line.trim();
  return trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.slice(1, -1).includes('|');
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isThematicBreak(trimmedLine: string): boolean {
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmedLine);
}

function toSafeHref(rawHref: string): string | null {
  try {
    const url = new URL(rawHref);

    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return rawHref;
    }
  } catch {
    return null;
  }

  return null;
}
