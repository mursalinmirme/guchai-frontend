import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { RobotFace } from "./robot-face";
import { RobotInterface } from "./robot-interface";
import { useRobot } from "@/hooks/use-robot";

// ─────────────────────────────────────────────────────────────
// Notification badge (unread / active state indicator)
// ─────────────────────────────────────────────────────────────

function ActiveDot() {
  return (
    <div className="absolute -top-0.5 -right-0.5">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: "var(--brand)" }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ background: "var(--brand)" }}
        />
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Robot Launcher — the floating action button
// ─────────────────────────────────────────────────────────────

export function RobotLauncher() {
  const {
    isOpen,
    open,
    close,
    robotState,
    statusLabel,
    conversation,
    inputValue,
    setInputValue,
    sendMessage,
    clearConversation,
  } = useRobot();

  const isBusy =
    robotState === "THINKING" ||
    robotState === "PROCESSING" ||
    robotState === "RESPONDING";

  const hasConversation = conversation.length > 0;

  return (
    <>
      {/* The chat panel */}
      <RobotInterface
        isOpen={isOpen}
        onClose={close}
        robotState={robotState}
        statusLabel={statusLabel}
        conversation={conversation}
        inputValue={inputValue}
        setInputValue={setInputValue}
        sendMessage={sendMessage}
        clearConversation={clearConversation}
      />

      {/* Floating Action Button */}
      <motion.button
        onClick={isOpen ? close : open}
        className="robot-fab fixed z-50 bottom-[76px] right-4 flex items-center justify-center rounded-2xl shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:bottom-6"
        style={{
          width: 56,
          height: 56,
          background: isOpen
            ? "var(--surface)"
            : "var(--bg-secondary)",
          border: `1.5px solid color-mix(in oklab, var(--brand) ${isOpen ? "40%" : "25%"}, var(--border))`,
          boxShadow: isOpen
            ? "0 4px 20px -4px rgba(0,0,0,0.4)"
            : "0 8px 32px -8px color-mix(in oklab, var(--brand) 35%, rgba(0,0,0,0.5))",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        aria-label={isOpen ? "Close Robot" : "Open Guchai Robot"}
        aria-expanded={isOpen}
      >
        {/* Relative container for badge */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.18 }}
              >
                <X
                  className="size-5"
                  style={{ color: "var(--text-dim)" }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="face"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18 }}
              >
                <RobotFace state={robotState} size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity indicator */}
          {!isOpen && (isBusy || hasConversation) && <ActiveDot />}
        </div>
      </motion.button>
    </>
  );
}
