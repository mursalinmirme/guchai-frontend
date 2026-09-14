import { useEffect, useRef, KeyboardEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BrainCircuit,
  CheckCircle,
  ChevronDown,
  CircleDot,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Bell,
  Zap,
} from "lucide-react";
import { Alena3DAvatar } from "./robot-3d-avatar";
import { VoiceVisualizer } from "./voice-visualizer";
import { RobotMemoryManager } from "./robot-memory-manager";
import { RobotNotifications } from "./robot-notifications";
import type { ConversationMessage, AlenaState, AlenaEmotion } from "@/hooks/use-alena";
import type { ToolExecution } from "@/api/robot.api";

// ─────────────────────────────────────────────────────────────
// Alena state label
// ─────────────────────────────────────────────────────────────

function getStateLabel(state: AlenaState, statusLabel: string): string {
  if (statusLabel) return statusLabel;
  switch (state) {
    case "IDLE":                   return "How can I help?";
    case "LISTENING":              return "Listening…";
    case "THINKING":               return "Thinking…";
    case "WORKING":                return "Working on it…";
    case "SPEAKING":               return "Speaking…";
    case "COMPLETED":              return "Done!";
    case "ERROR":                  return "Something went wrong.";
    case "PROACTIVE_NOTIFICATION": return "I have a notification for you";
    case "WAITING_FOR_USER":       return "Waiting for you…";
    default:                       return "How can I help?";
  }
}

// ─────────────────────────────────────────────────────────────
// Tool execution badge
// ─────────────────────────────────────────────────────────────

function ToolExecutionBadge({ execution }: { execution: ToolExecution }) {
  const success = execution.result.success;
  return (
    <div
      className="flex items-center gap-1.5 text-[10px] font-medium rounded-md px-2 py-1"
      style={{
        background: success
          ? "color-mix(in oklab, var(--success) 12%, transparent)"
          : "color-mix(in oklab, var(--danger) 12%, transparent)",
        color: success ? "var(--success)" : "var(--danger)",
        border: `1px solid color-mix(in oklab, ${success ? "var(--success)" : "var(--danger)"} 20%, transparent)`,
      }}
    >
      {success ? (
        <CheckCircle className="size-3 shrink-0" />
      ) : (
        <CircleDot className="size-3 shrink-0" />
      )}
      <span className="truncate">{execution.label.replace("…", "").trim()}</span>
      {success ? <span className="opacity-70">✓</span> : <span className="opacity-70">✗</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Tool executions */}
      {msg.toolExecutions && msg.toolExecutions.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-[80%]">
          {msg.toolExecutions.map((te, i) => (
            <ToolExecutionBadge key={i} execution={te} />
          ))}
        </div>
      )}

      {/* Bubble */}
      <div
        className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "var(--brand)",
                color: "var(--brand-foreground)",
                borderBottomRightRadius: 6,
              }
            : {
                background: "var(--surface)",
                color: "var(--text-main)",
                border: "1px solid var(--border)",
                borderBottomLeftRadius: 6,
              }
        }
      >
        {msg.isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin opacity-70" />
            <span className="text-xs opacity-60">Working on it…</span>
          </div>
        ) : (
          <div className="[&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ul:last-child]:mb-0 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>ol:last-child]:mb-0 [&>ul>li]:mb-1 [&>ul>li:last-child]:mb-0 [&>ol>li]:mb-1 [&>ol>li:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-[var(--input)] [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] opacity-40 px-1">
        {msg.timestamp.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggestion chips
// ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Show today's tasks",
  "What's overdue?",
  "My productivity this week",
  "Create a task for tomorrow",
];

function SuggestionChips({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-[11px] px-2.5 py-1.5 rounded-full border border-border text-text-dim hover:text-text-main hover:border-brand/40 hover:bg-brand/5 transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Alena Header — premium identity bar
// ─────────────────────────────────────────────────────────────

interface AlenaHeaderProps {
  alenaState: AlenaState;
  emotion: AlenaEmotion;
  statusLabel: string;
  isVoiceOutSupported: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  stopSpeaking: () => void;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  showMemory: boolean;
  setShowMemory: (v: boolean) => void;
  hasConversation: boolean;
  clearConversation: () => void;
  onClose: () => void;
}

function AlenaHeader({
  alenaState, emotion, statusLabel,
  isVoiceOutSupported, isSpeaking, voiceEnabled, toggleVoice, stopSpeaking,
  showNotifications, setShowNotifications, showMemory, setShowMemory,
  hasConversation, clearConversation, onClose,
}: AlenaHeaderProps) {
  const label = getStateLabel(alenaState, statusLabel);
  const isBusy = alenaState === "THINKING" || alenaState === "WORKING";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 shrink-0 relative overflow-hidden"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Subtle gradient backdrop on active state */}
      <AnimatePresence>
        {alenaState !== "IDLE" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: "linear-gradient(135deg, rgba(129,140,248,0.04) 0%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ALENA Avatar */}
      <Alena3DAvatar state={alenaState} emotion={emotion} size="sm" />

      {/* Identity + Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold leading-none tracking-wide">Alena</span>
          <Sparkles className="size-3 text-brand opacity-70" />
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-widest opacity-50"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            AI
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            className="text-[11px] mt-0.5 leading-none truncate"
            style={{ color: "var(--text-dim)" }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isBusy ? (
              <span className="flex items-center gap-1">
                <Zap className="size-2.5 inline-block animate-pulse" style={{ color: "#a78bfa" }} />
                {label}
              </span>
            ) : label}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {isVoiceOutSupported && (
          <button
            onClick={isSpeaking ? stopSpeaking : toggleVoice}
            className={`p-1.5 rounded-lg transition-colors ${
              isSpeaking
                ? "bg-brand text-white animate-pulse"
                : voiceEnabled
                ? "text-brand hover:bg-brand/10"
                : "hover:bg-white/5 text-text-dim hover:text-text-main"
            }`}
            title={isSpeaking ? "Stop speaking" : voiceEnabled ? "Voice output enabled" : "Voice output disabled"}
          >
            {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
        )}

        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowMemory(false); }}
          className={`relative p-1.5 rounded-lg transition-colors ${showNotifications ? "bg-brand/10 text-brand" : "hover:bg-white/5 text-text-dim hover:text-text-main"}`}
          title="Notifications"
        >
          <Bell className="size-4" />
        </button>

        <button
          onClick={() => { setShowMemory(!showMemory); setShowNotifications(false); }}
          className={`p-1.5 rounded-lg transition-colors ${showMemory ? "bg-brand/10 text-brand" : "hover:bg-white/5 text-text-dim hover:text-text-main"}`}
          title="Memory"
        >
          <BrainCircuit className="size-4" />
        </button>

        {hasConversation && (
          <button
            onClick={clearConversation}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-main transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-main transition-colors"
          title="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Interface Panel
// ─────────────────────────────────────────────────────────────

interface RobotInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  robotState: AlenaState;
  emotion: AlenaEmotion;
  statusLabel: string;
  conversation: ConversationMessage[];
  inputValue: string;
  setInputValue: (v: string) => void;
  sendMessage: (text: string) => void;
  clearConversation: () => void;
  isVoiceInSupported: boolean;
  isVoiceOutSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
}

export function RobotInterface({
  isOpen,
  onClose,
  robotState,
  emotion,
  statusLabel,
  conversation,
  inputValue,
  setInputValue,
  sendMessage,
  clearConversation,
  isVoiceInSupported,
  isVoiceOutSupported,
  isListening,
  isSpeaking,
  voiceEnabled,
  toggleVoice,
  startListening,
  stopListening,
  stopSpeaking,
}: RobotInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const isBusy = robotState === "THINKING" || robotState === "WORKING";
  const isEmpty = conversation.length === 0;

  const vizMode = isListening ? "listening" : isSpeaking ? "speaking" : "idle";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isBusy && inputValue.trim()) {
        sendMessage(inputValue);
      }
    }
  };

  const handleSuggestion = (text: string) => {
    setInputValue(text);
    sendMessage(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={[
              "fixed z-50 flex flex-col overflow-hidden",
              "bottom-0 left-0 right-0 h-[90dvh] rounded-t-[20px]",
              "lg:bottom-[88px] lg:right-6 lg:left-auto lg:w-[390px] lg:h-[600px] lg:rounded-[20px]",
            ].join(" ")}
            style={{
              background: "linear-gradient(180deg, #0f0f1a 0%, #0a0a14 100%)",
              border: "1px solid rgba(129,140,248,0.15)",
              boxShadow: "0 24px 80px -12px rgba(0,0,0,0.8), 0 0 40px -20px rgba(129,140,248,0.2)",
            }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            {/* ── HEADER ── */}
            <AlenaHeader
              alenaState={robotState}
              emotion={emotion}
              statusLabel={statusLabel}
              isVoiceOutSupported={isVoiceOutSupported}
              isSpeaking={isSpeaking}
              voiceEnabled={voiceEnabled}
              toggleVoice={toggleVoice}
              stopSpeaking={stopSpeaking}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              showMemory={showMemory}
              setShowMemory={setShowMemory}
              hasConversation={conversation.length > 0}
              clearConversation={clearConversation}
              onClose={onClose}
            />

            {/* ── CONDITIONAL VIEW ── */}
            {showMemory ? (
              <div className="flex-1 overflow-hidden">
                <RobotMemoryManager onClose={() => setShowMemory(false)} />
              </div>
            ) : showNotifications ? (
              <div className="flex-1 overflow-hidden">
                <RobotNotifications onClose={() => setShowNotifications(false)} />
              </div>
            ) : (
              <>
                {/* ── CONVERSATION AREA ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
                  {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full gap-5 pb-8">
                      {/* Large avatar for empty state */}
                      <Alena3DAvatar state={robotState} emotion={emotion} size="lg" />
                      <div className="text-center space-y-1.5">
                        <p className="text-base font-semibold text-text-main">Hi, I'm Alena</p>
                        <p className="text-xs text-text-dim max-w-[220px] leading-relaxed">
                          Your personal AI assistant. Ask me to manage your tasks, check your schedule, or analyze your productivity.
                        </p>
                      </div>
                    </div>
                  )}

                  {conversation.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* ── SUGGESTIONS ── */}
                {isEmpty && (
                  <SuggestionChips onSelect={handleSuggestion} />
                )}

                {/* ── VOICE VISUALIZER ── */}
                <AnimatePresence>
                  {(isListening || isSpeaking) && (
                    <motion.div
                      className="px-4 pb-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <VoiceVisualizer
                        isActive={isListening || isSpeaking}
                        emotion={emotion}
                        mode={vizMode}
                        barCount={28}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── INPUT AREA ── */}
                <div
                  className="px-3 py-3 shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="flex items-end gap-2 rounded-xl px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? "Listening…" : "Ask Alena anything…"}
                      rows={1}
                      disabled={isBusy || isListening}
                      className="flex-1 bg-transparent text-sm text-text-main placeholder:text-text-dim resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed disabled:opacity-50"
                      style={{ scrollbarWidth: "none" }}
                      onInput={(e) => {
                        const t = e.currentTarget;
                        t.style.height = "auto";
                        t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                      }}
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      {isVoiceInSupported && (
                        <button
                          onClick={isListening ? stopListening : startListening}
                          disabled={isBusy}
                          className={`p-1.5 rounded-lg transition-all ${
                            isListening
                              ? "bg-red-500/10 text-red-400 animate-pulse"
                              : "text-text-dim hover:text-text-main hover:bg-white/5 disabled:opacity-40"
                          }`}
                          title={isListening ? "Stop listening" : "Voice input"}
                        >
                          {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                        </button>
                      )}

                      <button
                        onClick={() => sendMessage(inputValue)}
                        disabled={isBusy || (!inputValue.trim() && !isListening)}
                        className="p-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: isBusy ? "rgba(255,255,255,0.05)" : "var(--brand)",
                          color: isBusy ? "var(--text-dim)" : "var(--brand-foreground)",
                        }}
                      >
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-dim text-center mt-1.5 opacity-40">
                    Enter to send · Shift+Enter for new line · Say "Hey Alena" to wake
                  </p>
                </div>
              </>
            )}

            {/* Mobile drag indicator */}
            <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2">
              <div className="w-8 h-1 rounded-full opacity-20" style={{ background: "var(--text-dim)" }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
