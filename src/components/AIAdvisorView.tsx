import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, Loader2, ShieldCheck, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const SUGGESTED_QUERIES = [
  'What is the standard SLA for fixing a deep pothole?',
  'How does the AI calculate issue priority scores?',
  'Who do I contact for an urgent gas leak or live wire?',
  'What happens after I submit a civic report?',
];

export const AIAdvisorView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: 'Hello! I am CivicGuard Advisor, your AI guide to municipal services and civic reporting. How can I help you navigate city regulations, report emergencies, or track maintenance requests today?',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          text: data.reply || 'I am processing your query with municipal guidelines.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Failed to get answer');
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        text: 'CivicGuard Advisor: For urgent emergencies like fallen power lines or gas odors, immediately contact 911 or city emergency dispatch. For regular issues, you can file a photo report via the "Report Issue" button.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[78vh] flex flex-col glass-panel rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>CivicGuard AI Advisor</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 uppercase">
                Gemini 3.8
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              City governance assistance, SLA standards, and civic hazard guidance.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified City Knowledge</span>
        </div>
      </div>

      {/* Suggested chips if conversation is young */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-white/5 flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-left px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-indigo-400 transition-all hover:scale-[1.01]"
            >
              💡 {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'glass-card text-slate-800 dark:text-slate-200 shadow-sm whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card rounded-2xl p-4 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>CivicGuard Advisor is searching city records...</span>
            </div>
          </div>
        )}
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about city regulations, pothole repairs, or issue tracking..."
            className="flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm glass-input text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/25 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Advisor</span>
          </button>
        </form>
      </div>

    </div>
  );
};
