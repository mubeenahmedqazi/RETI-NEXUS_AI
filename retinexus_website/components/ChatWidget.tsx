'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Eye, Loader2, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ReportSlots {
  patientName?: string;
  phoneNumber?: string;
  reportId?: string;
}

type Route = 'eye_doctor' | 'report_sql';

const TYPEWRITER_TEXT = "Hi I'm RetiNexus AI Assistant";

const GREETING: ChatTurn = {
  role: 'assistant',
  content:
    "Hi! I'm the RetiNexus AI assistant. Choose an option below, or just type your question.",
};

const PRIMERS: Record<Route, string> = {
  eye_doctor: 'Great — ask me anything about diabetic retinopathy, eye health, or how RetiNexus works.',
  report_sql:
    "Sure — to pull up your report I'll need the patient's full name, the phone number on file, and the report ID. You can share them one at a time or all together.",
};

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold" style={{ color: 'var(--brand-secondary)' }}>
      {children}
    </strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-[11px] not-italic opacity-75">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [slots, setSlots] = useState<ReportSlots>({});
  const [route, setRoute] = useState<Route | undefined>(undefined);
  const [pinned, setPinned] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [botVisible, setBotVisible] = useState(true);
  // Persisted so the server's LangGraph checkpointer (see lib/agents/graph.ts) can find
  // this conversation's prior turns across requests instead of relying solely on the
  // client resending the full message history every time.
  const [threadId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const KEY = 'retinexus_chat_thread_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Peek-a-boo: the floating logo shows for a while, hides for 5s, then
  // reappears — repeating. Paused (always shown) while the chat is open.
  useEffect(() => {
    if (isOpen) {
      setBotVisible(true);
      return;
    }
    const SHOW_MS = 10000;
    const HIDE_MS = 5000;
    let visible = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    const cycle = () => {
      visible = !visible;
      setBotVisible(visible);
      timeoutId = setTimeout(cycle, visible ? SHOW_MS : HIDE_MS);
    };
    timeoutId = setTimeout(cycle, SHOW_MS);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  // Typewriter loop for the caption under the floating logo: types the
  // greeting out, pauses, backspaces it, pauses, and repeats. Only runs
  // while the widget is closed.
  useEffect(() => {
    if (isOpen) return;
    let i = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting) {
        i++;
        setTypedText(TYPEWRITER_TEXT.slice(0, i));
        if (i === TYPEWRITER_TEXT.length) {
          timeoutId = setTimeout(() => {
            deleting = true;
            tick();
          }, 1600);
          return;
        }
        timeoutId = setTimeout(tick, 55);
      } else {
        i--;
        setTypedText(TYPEWRITER_TEXT.slice(0, i));
        if (i === 0) {
          timeoutId = setTimeout(() => {
            deleting = false;
            tick();
          }, 500);
          return;
        }
        timeoutId = setTimeout(tick, 28);
      }
    };

    timeoutId = setTimeout(tick, 300);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const selectMode = (mode: Route) => {
    setRoute(mode);
    setPinned(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: PRIMERS[mode] }]);
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);
    const wasPinned = pinned;
    setPinned(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, slots, route, pinned: wasPinned, threadId }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const displayText = acc.split('\n\n__STATE__')[0];
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: displayText };
          return next;
        });
      }

      const stateMatch = acc.match(/\n\n__STATE__(\{[\s\S]*\})$/);
      if (stateMatch) {
        try {
          const parsed = JSON.parse(stateMatch[1]);
          setSlots(parsed.slots || {});
          setRoute(parsed.route);
        } catch {
          // ignore malformed trailing state — conversation still works, just loses slot memory
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: "Sorry, I couldn't reach the assistant just now. Please try again in a moment.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const showQuickSelect = messages.length === 1 && !isStreaming;

  return (
    <>
      {/* Chat panel — opens centered on the right edge of the viewport, not stacked above the logo */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass fixed right-6 top-1/2 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-3rem)] -translate-y-1/2 flex-col overflow-hidden rounded-2xl"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between gap-2 border-b px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  RetiNexus Assistant
                </p>
                <p className="text-[11px]" style={{ color: 'var(--subtle-foreground)' }}>
                  {route === 'report_sql' ? 'Report Retrieval mode' : route === 'eye_doctor' ? 'Eye Doctor mode' : 'Eye health & report lookup'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-[var(--muted)]"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" style={{ color: 'var(--subtle-foreground)' }} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-hide px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      m.role === 'user'
                        ? { background: 'var(--brand-secondary)', color: '#ffffff' }
                        : { background: 'var(--muted)', color: 'var(--foreground)' }
                    }
                  >
                    {m.content ? (
                      m.role === 'assistant' ? (
                        <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--subtle-foreground)' }}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {showQuickSelect && (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => selectMode('eye_doctor')}
                    className="ring-focus flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <Eye className="h-4 w-4 flex-shrink-0 text-[var(--brand-secondary)]" />
                    <span>
                      <span className="font-medium">Eye Doctor</span> — ask about DR &amp; eye health
                    </span>
                  </button>
                  <button
                    onClick={() => selectMode('report_sql')}
                    className="ring-focus flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <ClipboardList className="h-4 w-4 flex-shrink-0 text-[var(--brand-secondary)]" />
                    <span>
                      <span className="font-medium">Report Retrieval</span> — check a screening result
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about DR, eye health, or your report..."
                  rows={1}
                  disabled={isStreaming}
                  className="ring-focus flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={() => send()}
                  disabled={isStreaming || !input.trim()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--brand-secondary)' }}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px]" style={{ color: 'var(--subtle-foreground)' }}>
                Not a substitute for professional medical advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating logo — flush to the bottom-right corner, peeks in/out on a loop, hidden while the panel is open (closing happens via the panel's own header X) */}
      <AnimatePresence>
        {botVisible && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed bottom-0 right-0 z-50 flex flex-col items-center gap-2"
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-64 w-64 items-center justify-center"
              aria-label="Open chat"
            >
              <span className="flex h-full w-full items-center justify-center drop-shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ai-chat-bot.svg" alt="Open RetiNexus AI chat assistant" className="h-full w-full object-contain" />
              </span>
            </motion.button>

            <p className="min-h-5 px-2 text-center text-sm font-medium" style={{ color: 'var(--brand-secondary)' }}>
              {typedText}
              <span className="animate-pulse">|</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
