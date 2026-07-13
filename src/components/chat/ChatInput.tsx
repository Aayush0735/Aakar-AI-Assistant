"use client";

/**
 * ChatInput — Message input field with send button
 *
 * Features:
 * - Auto-expanding textarea
 * - Character count indicator
 * - Disabled state during loading
 * - Enter to send, Shift+Enter for newline
 */

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  remaining?: number;
}

const MAX_CHARS = 500;

export default function ChatInput({
  onSend,
  disabled = false,
  remaining,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, MAX_CHARS);
    setValue(newValue);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  return (
    <div className="chat-input-container border-t border-slate-200 p-3">
      {/* Remaining messages indicator */}
      {remaining !== undefined && remaining <= 5 && (
        <div className="text-[10px] text-amber-400/70 px-2 pb-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {remaining} message{remaining !== 1 ? "s" : ""} remaining today
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Thinking..."
                : "Ask about courses, batches, fees..."
            }
            rows={1}
            className="w-full resize-none rounded-xl px-4 py-2.5 text-sm
              bg-white border border-slate-200
              text-slate-800 placeholder-slate-400 shadow-sm
              focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
            style={{ maxHeight: "120px", color: '#1e293b', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          />

          {/* Character count */}
          {isNearLimit && (
            <span
              className={`absolute bottom-1.5 right-3 text-[10px] transition-colors ${
                charCount >= MAX_CHARS
                  ? "text-red-400"
                  : "text-gray-500"
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-xl
            bg-gradient-to-br from-blue-600 to-emerald-500
            flex items-center justify-center
            shadow-lg shadow-blue-500/20
            hover:shadow-blue-500/30 hover:scale-105
            active:scale-95
            disabled:shadow-none disabled:hover:scale-100
            transition-all duration-200"
          style={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #10b981 100%)', 
            color: '#ffffff',
            opacity: disabled || !value.trim() ? 0.3 : 1 
          }}
          aria-label="Send message"
        >
          <svg
            className="w-4 h-4 text-white translate-x-[1px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
