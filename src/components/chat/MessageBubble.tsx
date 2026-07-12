"use client";

/**
 * MessageBubble — Styled message display for user and bot messages
 *
 * - User messages: right-aligned with gradient background
 * - Bot messages: left-aligned with frosted glass effect + avatar
 * - Supports markdown-style bold text and clickable links
 */

import React, { useMemo } from "react";

export interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  type?: "text" | "paper" | "error" | "quick-action";
}

interface MessageBubbleProps {
  message: Message;
}

/**
 * Basic markdown-like rendering:
 * - **bold** → <strong>
 * - [text](url) → <a>
 * - Newlines → <br>
 * - Bullet points (• or -) → styled list items
 */
function renderContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let currentParagraph: React.ReactNode[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="mb-3 last:mb-0">
          {currentParagraph}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="mb-3 last:mb-0 space-y-1.5 ml-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      flushList();
      flushParagraph();
      return;
    }

    const isBullet = /^[\*\-\•]\s/.test(trimmedLine);
    let remaining = isBullet ? trimmedLine.replace(/^[\*\-\•]\s/, "") : trimmedLine;
    const parts: React.ReactNode[] = [];
    let partIdx = 0;

    while (remaining.length > 0) {
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      const linkPos = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;
      const boldPos = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;

      if (linkPos === Infinity && boldPos === Infinity) {
        parts.push(<React.Fragment key={`part-${lineIdx}-${partIdx}`}>{remaining}</React.Fragment>);
        break;
      }

      if (linkPos < boldPos) {
        if (linkPos > 0) {
          parts.push(<React.Fragment key={`part-${lineIdx}-${partIdx}`}>{remaining.slice(0, linkPos)}</React.Fragment>);
          partIdx++;
        }
        parts.push(
          <a
            key={`part-${lineIdx}-${partIdx}`}
            href={linkMatch![2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00c288] hover:text-[#00a675] underline underline-offset-2 transition-colors font-medium"
          >
            {linkMatch![1]}
          </a>
        );
        remaining = remaining.slice(linkPos + linkMatch![0].length);
      } else {
        if (boldPos > 0) {
          parts.push(<React.Fragment key={`part-${lineIdx}-${partIdx}`}>{remaining.slice(0, boldPos)}</React.Fragment>);
          partIdx++;
        }
        parts.push(
          <strong
            key={`part-${lineIdx}-${partIdx}`}
            className="font-semibold text-slate-900"
          >
            {boldMatch![1]}
          </strong>
        );
        remaining = remaining.slice(boldPos + boldMatch![0].length);
      }
      partIdx++;
    }

    if (isBullet) {
      flushParagraph();
      currentList.push(
        <li key={`li-${lineIdx}`} className="flex items-start gap-2">
          <span className="text-[#00c288] mt-[0.4em] text-[8px] flex-shrink-0">●</span>
          <span>{parts}</span>
        </li>
      );
    } else {
      flushList();
      if (currentParagraph.length > 0) {
        currentParagraph.push(<br key={`br-${lineIdx}`} />);
      }
      currentParagraph.push(...parts);
    }
  });

  flushParagraph();
  flushList();

  return blocks;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const renderedContent = useMemo(
    () => renderContent(message.content),
    [message.content]
  );

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-slide-in-right">
        <div className="bg-[#00c288] max-w-[85%] px-5 py-3.5 rounded-3xl text-white shadow-sm">
          <p className="text-[15px] leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-slide-in-left gap-1">
      <div className="self-start bg-[#f4f4f5] text-slate-800 px-5 py-3.5 rounded-3xl max-w-[85%]">
        <div className="text-[15px] leading-relaxed">
          {renderedContent}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-0.5 ml-2">
        Aakar's Assistant • AI Agent • {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
