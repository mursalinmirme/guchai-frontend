import { motion, AnimatePresence } from "framer-motion";
import type { RobotState } from "@/hooks/use-robot";

interface RobotFaceProps {
  state: RobotState;
  size?: "sm" | "md" | "lg";
}

// Eye shapes per state
function getEyeConfig(state: RobotState) {
  switch (state) {
    case "THINKING":
    case "PROCESSING":
      return { shape: "squint" }; // narrowed eyes
    case "SUCCESS":
      return { shape: "happy" }; // curved eyes
    case "ERROR":
      return { shape: "sad" }; // downturned
    case "LISTENING":
    case "PROACTIVE":
      return { shape: "wide" }; // wide open
    case "RESPONDING":
    case "SPEAKING":
      return { shape: "normal" };
    default:
      return { shape: "normal" };
  }
}

function getStatusColor(state: RobotState): string {
  switch (state) {
    case "SUCCESS":
      return "var(--success)";
    case "ERROR":
      return "var(--danger)";
    case "THINKING":
    case "PROCESSING":
    case "PROACTIVE":
      return "var(--warning)";
    case "LISTENING":
    case "RESPONDING":
    case "SPEAKING":
      return "var(--brand)";
    default:
      return "var(--brand)";
  }
}

// Individual eye component
function Eye({ state, side }: { state: RobotState; side: "left" | "right" }) {
  const config = getEyeConfig(state);

  const eyeBase = (
    <motion.div
      className="rounded-full flex items-center justify-center overflow-hidden"
      style={{
        width: 20,
        height: 20,
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {config.shape === "happy" ? (
        <svg width="12" height="8" viewBox="0 0 12 8">
          <path
            d="M1 7 Q6 1 11 7"
            stroke={getStatusColor(state)}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ) : config.shape === "sad" ? (
        <svg width="12" height="8" viewBox="0 0 12 8">
          <path
            d="M1 1 Q6 7 11 1"
            stroke={getStatusColor(state)}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ) : config.shape === "squint" ? (
        <motion.div
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getStatusColor(state),
          }}
        />
      ) : config.shape === "wide" ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: getStatusColor(state),
          }}
        />
      ) : (
        /* normal */
        <motion.div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getStatusColor(state),
          }}
          animate={state === "IDLE" ? { opacity: [1, 0, 1] } : {}}
          transition={state === "IDLE" ? { duration: 3, repeat: Infinity, times: [0, 0.02, 0.04], delay: side === "right" ? 0.1 : 0 } : {}}
        />
      )}
    </motion.div>
  );

  return eyeBase;
}

// Mouth component
function Mouth({ state }: { state: RobotState }) {
  const color = getStatusColor(state);

  if (state === "SUCCESS") {
    return (
      <svg width="24" height="12" viewBox="0 0 24 12">
        <path d="M2 2 Q12 12 22 2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === "ERROR") {
    return (
      <svg width="24" height="12" viewBox="0 0 24 12">
        <path d="M2 10 Q12 2 22 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === "THINKING" || state === "PROCESSING") {
    return (
      <motion.div
        className="flex gap-0.5 items-end"
        style={{ height: 8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: 3, borderRadius: 2, background: color }}
            animate={{ height: [3, 8, 3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    );
  }
  if (state === "LISTENING") {
    return (
      <motion.div
        style={{
          width: 16,
          height: 4,
          borderRadius: 4,
          background: color,
          opacity: 0.8,
        }}
        animate={{ scaleX: [1, 0.6, 1.2, 0.8, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
  if (state === "SPEAKING") {
    return (
      <motion.div
        className="flex gap-0.5 items-center"
        style={{ height: 8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: 3, borderRadius: 2, background: color }}
            animate={{ height: [3, Math.random() * 6 + 4, 3] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    );
  }
  // Default neutral line
  return (
    <div style={{ width: 14, height: 2, borderRadius: 2, background: color, opacity: 0.6 }} />
  );
}

// Status indicator dot
function StatusDot({ state }: { state: RobotState }) {
  const color = getStatusColor(state);
  const isAnimating = state !== "IDLE";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
      {isAnimating && (
        <motion.div
          className="absolute rounded-full"
          style={{ background: color, opacity: 0.3 }}
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <div
        className="rounded-full"
        style={{ width: 6, height: 6, background: color }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Robot Face
// ─────────────────────────────────────────────────────────────

export function RobotFace({ state, size = "md" }: RobotFaceProps) {
  const dim = size === "sm" ? 56 : size === "lg" ? 96 : 72;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center rounded-2xl select-none"
      style={{
        width: dim,
        height: dim,
        background: "var(--bg-secondary)",
        border: `1px solid color-mix(in oklab, ${getStatusColor(state)} 30%, var(--border))`,
        boxShadow: `0 0 20px -4px color-mix(in oklab, ${getStatusColor(state)} 25%, transparent)`,
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}
      animate={{
        y: state === "IDLE" ? [0, -2, 0] : 0,
      }}
      transition={
        state === "IDLE"
          ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
    >
      {/* Antenna */}
      <div
        className="absolute"
        style={{ top: -10, left: "50%", transform: "translateX(-50%)" }}
        aria-hidden
      >
        <div style={{ width: 2, height: 8, background: "var(--border)", margin: "0 auto" }} />
        <StatusDot state={state} />
      </div>

      {/* Face panel */}
      <div
        className="flex flex-col items-center gap-2 rounded-xl"
        style={{
          width: dim - 16,
          padding: "8px 6px",
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Eyes */}
        <div className="flex gap-3 items-center">
          <Eye state={state} side="left" />
          <Eye state={state} side="right" />
        </div>

        {/* Mouth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
            style={{ height: 14 }}
          >
            <Mouth state={state} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
