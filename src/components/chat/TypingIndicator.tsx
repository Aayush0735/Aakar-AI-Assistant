"use client";

/**
 * TypingIndicator — Animated three-dot typing indicator
 *
 * Shown while the bot is processing the user's message.
 * Features a bouncing dot animation with staggered delays.
 */

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        </svg>
      </div>

      {/* Typing dots container */}
      <div className="chat-bubble-bot px-5 py-4 rounded-2xl rounded-tl-md">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
