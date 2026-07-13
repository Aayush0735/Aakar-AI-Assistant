"use client";

/**
 * ChatWidget — Main chat widget container with FAB trigger
 *
 * This is the top-level component that manages:
 * - Open/closed state (FAB vs full chat panel)
 * - Message state and conversation flow
 * - API communication with the backend
 * - Quick action routing (zero-cost hardcoded responses)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import QuickActionChips from "./QuickActionChips";
import MessageBubble, { type Message } from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import type { QuickAction } from "@/data/quick-actions";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | undefined>(undefined);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("aakars_chat_history");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(hydrated);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aakars_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("aakars_chat_history");
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /**
   * Add a bot message to the conversation
   */
  const addBotMessage = useCallback(
    (content: string, type: Message["type"] = "text") => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content,
        timestamp: new Date(),
        type,
      };
      setMessages((prev) => [...prev, botMsg]);
    },
    []
  );

  /**
   * Handle quick action chip click — instant response, no API call
   */
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      // Add user message showing what they clicked
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: action.label,
        timestamp: new Date(),
        type: "quick-action",
      };
      setMessages((prev) => [...prev, userMsg]);

      // Instant bot response from hardcoded data
      setTimeout(() => {
        addBotMessage(action.response, "quick-action");
      }, 300); // Tiny delay for natural feel
    },
    [addBotMessage]
  );

  /**
   * Handle custom message — sends to backend API
   */
  const handleSendMessage = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const data = await res.json();

        if (res.status === 429) {
          addBotMessage(data.response, "error");
          setRemaining(0);
        } else if (res.ok) {
          addBotMessage(data.response, data.type);
          if (data.remaining !== undefined) {
            setRemaining(data.remaining);
          }
        } else {
          addBotMessage(
            data.response ||
            "Sorry, something went wrong. Please try again or call us at +91 7499571615.",
            "error"
          );
        }
      } catch {
        addBotMessage(
          "I'm having trouble connecting right now. Please check your internet connection and try again, or call us at +91 7499571615.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addBotMessage]
  );

  /**
   * Toggle chat open/closed
   */
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed z-50 w-[380px] max-h-[600px]
          chat-panel rounded-2xl overflow-hidden
          flex flex-col
          transition-all duration-500 ease-out
          ${isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
        style={{
          bottom: "6rem",
          right: "2rem",
          maxHeight: "min(600px, calc(100vh - 140px))",
        }}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {activeTab === 'home' ? (
            <div className="flex-1 flex flex-col bg-[#fafafa] overflow-y-auto">
              {/* Home Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-0.5 border border-slate-100 shadow-sm">
                  <img src="https://aakar-ai-assistant.vercel.app/logo.png" alt="Logo" className="w-full h-full object-contain scale-95" />
                </div>
                <button
                  onClick={toggleChat}
                  className="text-slate-400 hover:text-slate-600 p-1.5 transition-colors rounded-md hover:bg-slate-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Home Body */}
              <div className="px-5 pb-6">
                <h1 className="text-3xl font-bold text-slate-800 leading-[1.2] mt-2 mb-8">
                  Hi there 👋<br />
                  How can we help?
                </h1>

                {messages.length > 0 && (
                  <div 
                    onClick={() => setActiveTab('chat')}
                    className="bg-white border border-slate-100 rounded-xl p-4 mb-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs font-semibold text-slate-800 mb-3">Recent message</p>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 overflow-hidden p-0.5 flex-shrink-0">
                        <img src="https://aakar-ai-assistant.vercel.app/logo.png" className="w-full h-full object-contain scale-95" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[13px] font-semibold text-slate-800">Aakar's Assistant</span>
                          <span className="text-[11px] text-slate-400">
                            {messages[messages.length - 1].timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-500 truncate">
                          {messages[messages.length - 1].content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => setActiveTab('chat')}
                  className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-[14px] font-semibold text-[#00c288]">Send us a message</span>
                  <svg className="w-5 h-5 text-[#00c288]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              {/* Chat Header */}
              <div className="bg-white flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('home')}
                  className="mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ color: '#94a3b8' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-0.5 border border-slate-100 shadow-sm">
                <img src="https://aakar-ai-assistant.vercel.app/logo.png" alt="Logo" className="w-full h-full object-contain scale-95" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">
                  Aakar's Assistant
                </h3>
                <p className="text-[11px] font-medium text-[#00c288] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c288] animate-pulse" />
                  Online
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <button onClick={clearChat} className="hover:text-slate-600 p-1.5 transition-colors rounded-md hover:bg-slate-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
            <button onClick={toggleChat} className="hover:text-slate-600 p-1.5 transition-colors rounded-md hover:bg-slate-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          style={{ minHeight: "300px" }}
        >
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="animate-fade-in space-y-5">
              <div className="text-center pt-2 pb-1">
                <p className="text-[14px] text-slate-500">
                  Ask us anything, or share your feedback.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="self-start bg-[#f4f4f5] text-slate-800 px-5 py-3.5 rounded-3xl max-w-[85%]">
                  <p className="text-[15px] leading-relaxed">
                    How can we help?
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 ml-1">
                  Aakar's Assistant • AI Agent • Just now
                </p>
              </div>

              {/* Quick Action Chips */}
              <div className="pt-2">
                <QuickActionChips onSelect={handleQuickAction} />
              </div>
            </div>
          )}

          {/* Message history */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Quick Action Chips always available at bottom */}
          {messages.length > 0 && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <QuickActionChips onSelect={handleQuickAction} disabled={isLoading} />
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading || remaining === 0}
          remaining={remaining}
        />

              {/* Powered by footer */}
              <div className="px-4 py-2 border-t border-slate-200 text-center shrink-0">
                <p className="text-[10px] text-slate-500">
                  {/* Powered by Local AI */}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-white border-t border-slate-100 flex items-center justify-around py-2.5 shrink-0">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: activeTab === 'home' ? '#00c288' : '#94a3b8' }}
          >
            <svg className="w-5 h-5" fill={activeTab === 'home' ? "currentColor" : "none"} stroke={activeTab === 'home' ? "none" : "currentColor"} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: activeTab === 'chat' ? '#00c288' : '#94a3b8' }}
          >
            <svg className="w-5 h-5" fill={activeTab === 'chat' ? "currentColor" : "none"} stroke={activeTab === 'chat' ? "none" : "currentColor"} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
          </button>
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={toggleChat}
        className={`fixed z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-600 to-emerald-500
          flex items-center justify-center
          shadow-xl shadow-blue-500/30
          hover:shadow-blue-500/40 hover:scale-110
          active:scale-95
          transition-all duration-300
          fab-pulse`}
        style={{
          bottom: "2rem",
          right: "2rem"
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-0"}`}
        >
          {isOpen ? (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden p-1.5">
              <img src="https://aakar-ai-assistant.vercel.app/logo.png" alt="Chat" className="w-full h-full object-contain scale-95" />
            </div>
          )}
        </div>
      </button>
    </>
  );
}
