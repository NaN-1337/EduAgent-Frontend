import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Simple markdown parser for common patterns
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let currentListItems: string[] = [];
    let listKey = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(" ");
        elements.push(
          <p key={elements.length} className="mb-2 last:mb-0">
            {parseInlineMarkdown(paraText)}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside mb-2 space-y-1 ml-2">
            {currentListItems.map((item, idx) => (
              <li key={idx} className="ml-2">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("### ")) {
        flushList();
        flushParagraph();
        elements.push(
          <h3 key={elements.length} className="text-base font-semibold mt-3 mb-2">
            {parseInlineMarkdown(trimmed.substring(4))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushList();
        flushParagraph();
        elements.push(
          <h2 key={elements.length} className="text-lg font-semibold mt-4 mb-2">
            {parseInlineMarkdown(trimmed.substring(3))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        flushList();
        flushParagraph();
        elements.push(
          <h1 key={elements.length} className="text-xl font-bold mt-4 mb-2">
            {parseInlineMarkdown(trimmed.substring(2))}
          </h1>
        );
        return;
      }

      // Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
        flushParagraph();
        const listItem = trimmed.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "");
        currentListItems.push(listItem);
        return;
      }

      // End of list
      if (currentListItems.length > 0 && trimmed === "") {
        flushList();
        return;
      }

      // Code blocks
      if (trimmed.startsWith("```")) {
        flushList();
        flushParagraph();
        return;
      }

      // Regular paragraph
      if (trimmed === "") {
        flushList();
        flushParagraph();
      } else {
        if (currentListItems.length > 0) {
          flushList();
        }
        currentParagraph.push(trimmed);
      }
    });

    flushList();
    flushParagraph();

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    if (!text || typeof text !== 'string') return [text || ''];
    
    try {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;

      // Simple approach: process patterns one at a time, replacing as we go
      // Start with the most specific patterns first
      
      // 1. Bold (**text**)
      const boldRegex = /\*\*(.+?)\*\*/g;
      const boldMatches: Array<{ start: number; end: number; content: string }> = [];
      let match;
      while ((match = boldRegex.exec(text)) !== null) {
        if (match && match[1]) {
          boldMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
          });
        }
      }

      // 2. Links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const linkMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
      while ((match = linkRegex.exec(text)) !== null) {
        if (match && match[1] && match[2]) {
          linkMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            url: match[2],
          });
        }
      }

      // 3. Code (`code`)
      const codeRegex = /`([^`]+)`/g;
      const codeMatches: Array<{ start: number; end: number; content: string }> = [];
      while ((match = codeRegex.exec(text)) !== null) {
        if (match && match[1]) {
          codeMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
          });
        }
      }

      // Combine all matches and sort by position
      type MarkdownMatch = {
        start: number;
        end: number;
        type: 'bold' | 'link' | 'code';
        content?: string;
        text?: string;
        url?: string;
      };

      const allMatches: MarkdownMatch[] = [
        ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
        ...linkMatches.map(m => ({ ...m, type: 'link' as const })),
        ...codeMatches.map(m => ({ ...m, type: 'code' as const })),
      ].sort((a, b) => a.start - b.start);

      // Remove overlaps (keep first match)
      const filteredMatches: MarkdownMatch[] = [];
      allMatches.forEach((match) => {
        const overlaps = filteredMatches.some(
          (existing) => !(match.end <= existing.start || match.start >= existing.end)
        );
        if (!overlaps) {
          filteredMatches.push(match);
        }
      });

      // Build result
      let lastIndex = 0;
      filteredMatches.forEach((match) => {
        // Add text before match
        if (match.start > lastIndex) {
          parts.push(text.substring(lastIndex, match.start));
        }

        // Add formatted match
        if (match.type === 'bold' && match.content) {
          parts.push(<strong key={`md-${currentIndex++}`}>{match.content}</strong>);
        } else if (match.type === 'link' && match.text && match.url) {
          parts.push(
            <a
              key={`md-${currentIndex++}`}
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {match.text}
            </a>
          );
        } else if (match.type === 'code' && match.content) {
          parts.push(
            <code key={`md-${currentIndex++}`} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {match.content}
            </code>
          );
        }

        lastIndex = match.end;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : [text];
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return [text];
    }
  };

  return (
    <div className={className}>
      {parseMarkdown(content)}
    </div>
  );
}

