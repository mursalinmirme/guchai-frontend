import { motion, AnimatePresence } from "framer-motion";
import type { AlenaState, AlenaEmotion } from "@/hooks/use-alena";

interface AlenaAvatarProps {
  state: AlenaState;
  emotion: AlenaEmotion;
  size?: "sm" | "md" | "lg";
}

// ─────────────────────────────────────────────────────────────
// Emotion → visual color mapping
// ─────────────────────────────────────────────────────────────

function getEmotionColor(emotion: AlenaEmotion): string {
  switch (emotion) {
    case "HAPPY":
    case "EXCITED":    return "#22d3ee";   // cyan
    case "CALM":
    case "NEUTRAL":    return "#818cf8";   // indigo
    case "FRIENDLY":
    case "ENCOURAGING":return "#34d399";   // emerald
    case "FOCUSED":
    case "CONFIDENT":  return "#60a5fa";   // blue
    case "THINKING":   return "#a78bfa";   // violet
    case "CONCERNED":  return "#fbbf24";   // amber
    case "ERROR":      return "#f87171";   // red
    default:           return "#818cf8";   // indigo
  }
}

function getEmotionGlow(emotion: AlenaEmotion): string {
  const c = getEmotionColor(emotion);
  return `0 0 32px -4px ${c}88, 0 0 8px -2px ${c}44`;
}

// ─────────────────────────────────────────────────────────────
// Eye component — holographic style
// ─────────────────────────────────────────────────────────────

function HoloEye({ state, emotion, side }: { state: AlenaState; emotion: AlenaEmotion; side: "left" | "right" }) {
  const color = getEmotionColor(emotion);
  const isThinking = state === "THINKING" || state === "WORKING";
  const isListening = state === "LISTENING";
  const isSpeaking  = state === "SPEAKING";
  const isCompleted = state === "COMPLETED";
  const isError     = state === "ERROR";

  // Blink timing offset by side
  const blinkDelay = side === "right" ? 0.1 : 0;

  if (isError) {
    return (
      <div
        className="flex items-center justify-center rounded-sm overflow-hidden"
        style={{ width: 18, height: 18, background: "#1e1e2e", border: "1px solid #f8717144" }}
      >
        <svg width="10" height="7" viewBox="0 0 10 7">
          <path d="M1 1 Q5 6 9 1" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: 18, height: 18, background: "#1e1e2e", border: `1px solid ${color}44` }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <svg width="10" height="7" viewBox="0 0 10 7">
          <path d="M1 6 Q5 1 9 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>
    );
  }

  if (isThinking) {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: 18, height: 18, background: "#1e1e2e", border: `1px solid ${color}44` }}
      >
        <motion.div
          style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ scaleY: [1, 0.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: blinkDelay * 0.5 }}
        />
      </motion.div>
    );
  }

  if (isListening) {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: 18, height: 18, background: "#1e1e2e", border: `1px solid ${color}44` }}
      >
        <motion.div
          style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    );
  }

  if (isSpeaking) {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: 18, height: 18, background: "#1e1e2e", border: `1px solid ${color}44` }}
      >
        <motion.div
          style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ scaleY: [1, 0.4, 0.9, 0.3, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: blinkDelay }}
        />
      </motion.div>
    );
  }

  // IDLE — gentle blink
  return (
    <motion.div
      className="flex items-center justify-center rounded-full overflow-hidden"
      style={{ width: 18, height: 18, background: "#1e1e2e", border: `1px solid ${color}33` }}
    >
      <motion.div
        style={{ width: 7, height: 7, borderRadius: "50%", background: color, opacity: 0.85, boxShadow: `0 0 5px ${color}88` }}
        animate={{ scaleY: [1, 1, 0.05, 1, 1], opacity: [0.85, 0.85, 0, 0.85, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1], delay: blinkDelay * 3 + Math.random() * 2 }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mouth — holographic style
// ─────────────────────────────────────────────────────────────

function HoloMouth({ state, emotion }: { state: AlenaState; emotion: AlenaEmotion }) {
  const color = getEmotionColor(emotion);

  if (state === "COMPLETED") {
    return (
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg width="22" height="10" viewBox="0 0 22 10">
          <path d="M2 1 Q11 10 20 1" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>
    );
  }

  if (state === "ERROR") {
    return (
      <svg width="22" height="10" viewBox="0 0 22 10">
        <path d="M2 9 Q11 1 20 9" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (state === "THINKING" || state === "WORKING") {
    return (
      <div className="flex gap-0.5 items-end" style={{ height: 8 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: 2.5, borderRadius: 2, background: color, boxShadow: `0 0 4px ${color}` }}
            animate={{ height: [2, 8, 2] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  if (state === "LISTENING") {
    return (
      <motion.div
        style={{ width: 14, height: 3, borderRadius: 4, background: color, boxShadow: `0 0 6px ${color}` }}
        animate={{ scaleX: [0.6, 1.3, 0.8, 1.1, 0.7, 1] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (state === "SPEAKING") {
    return (
      <div className="flex gap-0.5 items-center" style={{ height: 8 }}>
        {[3, 6, 4, 7, 3].map((h, i) => (
          <motion.div
            key={i}
            style={{ width: 2, borderRadius: 2, background: color, boxShadow: `0 0 3px ${color}` }}
            animate={{ height: [2, h, 2] }}
            transition={{ duration: 0.25, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  if (state === "PROACTIVE_NOTIFICATION") {
    return (
      <motion.div
        style={{ width: 14, height: 3, borderRadius: 4, background: color }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    );
  }

  // IDLE — subtle neutral
  return (
    <motion.div
      style={{ width: 12, height: 2, borderRadius: 2, background: color, opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.7, 0.5], width: [12, 14, 12] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Holographic rings
// ─────────────────────────────────────────────────────────────

function HoloRings({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <>
      {[1, 1.5, 2].map((scale, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: `1px solid ${color}`,
            opacity: 0,
          }}
          animate={{ scale: [1, scale], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Scanline effect
// ─────────────────────────────────────────────────────────────

function Scanline({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-x-0 pointer-events-none"
      style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }}
      animate={{ top: ["10%", "90%", "10%"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main AlenaAvatar Component
// ─────────────────────────────────────────────────────────────

export function AlenaAvatar({ state, emotion, size = "md" }: AlenaAvatarProps) {
  const dim = size === "sm" ? 52 : size === "lg" ? 104 : 72;
  const color = getEmotionColor(emotion);
  const glow = getEmotionGlow(emotion);
  const isActive = state !== "IDLE";

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center rounded-2xl select-none overflow-visible"
      style={{
        width: dim,
        height: dim,
        background: "linear-gradient(145deg, #12121f, #0d0d1a)",
        border: `1px solid ${color}33`,
        boxShadow: glow,
        transition: "border-color 0.5s, box-shadow 0.5s",
        flexShrink: 0,
      }}
      animate={{ y: state === "IDLE" ? [0, -2, 0] : 0 }}
      transition={state === "IDLE" ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
    >
      {/* Holographic rings (active state only) */}
      <HoloRings color={color} active={isActive} />

      {/* Scanline effect */}
      <Scanline color={color} />

      {/* Corner accents */}
      {[
        { top: 4, left: 4, transform: "rotate(0deg)" },
        { top: 4, right: 4, transform: "rotate(90deg)" },
        { bottom: 4, left: 4, transform: "rotate(270deg)" },
        { bottom: 4, right: 4, transform: "rotate(180deg)" },
      ].map((pos, i) => (
        <svg
          key={i}
          width="8" height="8"
          viewBox="0 0 8 8"
          className="absolute pointer-events-none"
          style={{ ...pos, opacity: 0.6 }}
        >
          <path d="M0 8 L0 0 L8 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="square" />
        </svg>
      ))}

      {/* Antenna */}
      <div
        className="absolute"
        style={{ top: size === "sm" ? -8 : -12, left: "50%", transform: "translateX(-50%)" }}
        aria-hidden
      >
        <div style={{ width: 1.5, height: size === "sm" ? 6 : 10, background: `${color}88`, margin: "0 auto" }} />
        <motion.div
          style={{ width: 5, height: 5, borderRadius: "50%", background: color, margin: "0 auto", boxShadow: `0 0 6px ${color}` }}
          animate={isActive ? { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] } : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: isActive ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Face panel */}
      <div
        className="flex flex-col items-center gap-1.5 relative"
        style={{
          width: dim - (size === "sm" ? 12 : 16),
          padding: size === "sm" ? "5px 4px" : "8px 6px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 10,
          border: `1px solid ${color}22`,
        }}
      >
        {/* Eyes */}
        <div className="flex gap-2.5 items-center">
          <HoloEye state={state} emotion={emotion} side="left" />
          <HoloEye state={state} emotion={emotion} side="right" />
        </div>

        {/* Mouth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state}-${emotion}`}
            initial={{ opacity: 0, scaleX: 0.7 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.7 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
            style={{ height: size === "sm" ? 10 : 12 }}
          >
            <HoloMouth state={state} emotion={emotion} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom status bar */}
      <div
        className="absolute bottom-0 inset-x-0 mx-2 mb-1"
        style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Legacy RobotFace export for backward compat (renders AlenaAvatar)
// ─────────────────────────────────────────────────────────────
export function RobotFace({ state, size }: { state: AlenaState; size?: "sm" | "md" | "lg" }) {
  // Derive a basic emotion from state for backwards compatibility
  const emotionMap: Record<AlenaState, AlenaEmotion> = {
    IDLE: "CALM", LISTENING: "FOCUSED", THINKING: "THINKING",
    WORKING: "FOCUSED", SPEAKING: "FRIENDLY", COMPLETED: "HAPPY",
    ERROR: "ERROR", PROACTIVE_NOTIFICATION: "CONCERNED", WAITING_FOR_USER: "NEUTRAL",
  };
  return <AlenaAvatar state={state} emotion={emotionMap[state] ?? "NEUTRAL"} size={size} />;
}
