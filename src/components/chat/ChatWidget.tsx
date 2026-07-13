"use client";

/**
 * ChatWidget — Main chat widget container with FAB trigger
 *
 * This is the top-level component that manages:
 * - Open/closed state (FAB vs full chat panel)
 * - Multiple chat sessions and conversation flow
 * - API communication with the backend
 * - Quick action routing (zero-cost hardcoded responses)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import QuickActionChips from "./QuickActionChips";
import MessageBubble, { type Message } from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import type { QuickAction } from "@/data/quick-actions";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | undefined>(undefined);
  const [showMenu, setShowMenu] = useState(false);

  // Derived messages for current session
  const messages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("aakars_chat_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        // Convert timestamp strings back to Date objects
        const hydrated = parsed.map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setSessions(hydrated);
      } catch (e) {
        console.error("Failed to parse chat sessions", e);
      }
    } else {
      // Migrate old history if present
      const oldMessages = localStorage.getItem("aakars_chat_history");
      if (oldMessages) {
        try {
          const parsed = JSON.parse(oldMessages);
          const hydrated = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          if (hydrated.length > 0) {
            const migratedSession: ChatSession = {
              id: `session-${Date.now()}`,
              title: hydrated[0].content.substring(0, 30) + (hydrated[0].content.length > 30 ? '...' : ''),
              messages: hydrated,
              updatedAt: hydrated[hydrated.length - 1].timestamp
            };
            setSessions([migratedSession]);
          }
          localStorage.removeItem("aakars_chat_history");
        } catch (e) {}
      }
    }
  }, []);

  // Save chat history to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("aakars_chat_sessions", JSON.stringify(sessions));
    } else {
      localStorage.removeItem("aakars_chat_sessions");
    }
  }, [sessions]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setActiveTab('chat');
    setShowMenu(false);
  };

  const deleteCurrentChat = () => {
    if (currentSessionId) {
      setSessions(prev => prev.filter(s => s.id !== currentSessionId));
      setCurrentSessionId(null);
      setActiveTab('home');
    }
    setShowMenu(false);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, currentSessionId]);

  /**
   * Helper to append a message to the current session (or create a new one)
   */
  const appendMessage = useCallback((msg: Message) => {
    setSessions(prev => {
      let activeSession = prev.find(s => s.id === currentSessionId);
      
      if (!activeSession) {
        // Create new session
        const newSessionId = `session-${Date.now()}`;
        setCurrentSessionId(newSessionId);
        
        const title = msg.role === 'user' ? msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '') : 'New Chat';
        
        activeSession = {
          id: newSessionId,
          title,
          messages: [msg],
          updatedAt: new Date()
        };
        return [activeSession, ...prev];
      } else {
        // Update existing session
        const updatedSession = {
          ...activeSession,
          messages: [...activeSession.messages, msg],
          updatedAt: new Date()
        };
        // Move to top
        const filtered = prev.filter(s => s.id !== currentSessionId);
        return [updatedSession, ...filtered];
      }
    });
  }, [currentSessionId]);

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
      appendMessage(botMsg);
    },
    [appendMessage]
  );

  /**
   * Handle quick action chip click — instant response, no API call
   */
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: action.label,
        timestamp: new Date(),
        type: "quick-action",
      };
      appendMessage(userMsg);

      setTimeout(() => {
        addBotMessage(action.response, "quick-action");
      }, 300);
    },
    [appendMessage, addBotMessage]
  );

  /**
   * Handle custom message — sends to backend API
   */
  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      appendMessage(userMsg);
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
          addBotMessage(data.response || "Sorry, something went wrong. Please try again or call us at +91 7499571615.", "error");
        }
      } catch {
        addBotMessage("I'm having trouble connecting right now. Please check your internet connection and try again, or call us at +91 7499571615.", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, addBotMessage]
  );

  const toggleChat = () => setIsOpen(prev => !prev);

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
              <div className="px-5 pb-6" style={{ padding: '0 20px 24px' }}>
                <h1 className="text-3xl font-bold text-slate-800 leading-[1.2] mt-2 mb-8">
                  Hi there 👋<br />
                  How can we help?
                </h1>

                {sessions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Previous Chats</p>
                    <div className="space-y-2">
                      {sessions.map(session => (
                        <div 
                          key={session.id}
                          onClick={() => {
                            setCurrentSessionId(session.id);
                            setActiveTab('chat');
                          }}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] font-semibold text-slate-800 truncate pr-2">
                              {session.title}
                            </span>
                            <span className="text-[11px] text-slate-400 flex-shrink-0">
                              {session.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 truncate">
                            {session.messages[session.messages.length - 1]?.content || 'Empty chat'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => {
                    setCurrentSessionId(null);
                    setActiveTab('chat');
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-[14px] font-semibold text-[#00c288]">Start new chat</span>
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
                      <h3 
                        className="text-[15px] font-semibold text-slate-800 leading-tight"
                        style={{ fontWeight: 600, color: '#1e293b' }}
                      >
                        Aakar's Assistant
                      </h3>
                      <p className="text-[11px] font-medium text-[#00c288] flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00c288] animate-pulse" />
                        Online
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 relative">
                  <button onClick={() => setShowMenu(p => !p)} className="hover:text-slate-600 p-1.5 transition-colors rounded-md hover:bg-slate-50">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div 
                        className="absolute right-8 top-10 w-40 bg-white rounded-lg shadow-lg border border-slate-100 z-50 overflow-hidden"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #f1f5f9',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <button 
                          onClick={startNewChat}
                          className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New Chat
                        </button>
                        {currentSessionId && (
                          <button 
                            onClick={deleteCurrentChat}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Chat
                          </button>
                        )}
                      </div>
                    </>
                  )}

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
                style={{ minHeight: "300px", padding: '16px' }}
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
