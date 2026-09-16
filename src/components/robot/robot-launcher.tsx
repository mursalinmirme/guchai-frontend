import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Alena3DAvatar } from "./robot-3d-avatar";
import { RobotInterface } from "./robot-interface";
import { useAlena } from "@/hooks/use-alena";
import { useQuery } from "@tanstack/react-query";
import { robotApi } from "@/api/robot.api";
import { useAlenaProactiveAlerts } from "@/hooks/use-alena-alerts";

// ─────────────────────────────────────────────────────────────
// Notification badge
// ─────────────────────────────────────────────────────────────

function ActiveDot({ count }: { count?: number }) {
  if (count && count > 0) {
    return (
      <div className="absolute -top-1.5 -right-1.5 z-10">
        <span
          className="relative flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-bg-secondary"
          style={{ background: "var(--brand)" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute -top-0.5 -right-0.5 z-10">
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
// Alena Launcher — floating action button
// ─────────────────────────────────────────────────────────────

export function RobotLauncher() {
  const {
    isOpen,
    open,
    close,
    alenaState,
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
    speak,
  } = useAlena();

  const { data: notifications = [] } = useQuery({
    queryKey: ["robot_notifications"],
    queryFn: robotApi.getNotifications,
    refetchInterval: 30000,
  });

  // Mount global proactive alerts watcher
  useAlenaProactiveAlerts(speak);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const isBusy = alenaState === "THINKING" || alenaState === "WORKING";
  const hasConversation = conversation.length > 0;

  return (
    <>
      {/* Chat panel */}
      <RobotInterface
        isOpen={isOpen}
        onClose={close}
        robotState={alenaState}
        emotion={emotion}
        statusLabel={statusLabel}
        conversation={conversation}
        inputValue={inputValue}
        setInputValue={setInputValue}
        sendMessage={sendMessage}
        clearConversation={clearConversation}
        isVoiceInSupported={isVoiceInSupported}
        isVoiceOutSupported={isVoiceOutSupported}
        isListening={isListening}
        isSpeaking={isSpeaking}
        voiceEnabled={voiceEnabled}
        toggleVoice={toggleVoice}
        startListening={startListening}
        stopListening={stopListening}
        stopSpeaking={stopSpeaking}
      />

      {/* Floating Action Button */}
      <motion.button
        onClick={isOpen ? close : open}
        className="robot-fab fixed z-50 bottom-[76px] right-4 flex items-center justify-center rounded-2xl shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:bottom-6"
        style={{
          width: 60,
          height: 60,
          background: "linear-gradient(145deg, #12121f, #0a0a14)",
          border: `1.5px solid rgba(129,140,248,${isOpen ? "0.5" : "0.2"})`,
          boxShadow: isOpen
            ? "0 4px 20px -4px rgba(0,0,0,0.6)"
            : "0 8px 32px -8px rgba(129,140,248,0.4), 0 0 0 0 rgba(129,140,248,0)",
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        aria-label={isOpen ? "Close Alena" : "Open Alena"}
        aria-expanded={isOpen}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.18 }}
              >
                <X className="size-5" style={{ color: "rgba(255,255,255,0.5)" }} />
              </motion.div>
            ) : (
              <motion.div
                key="face"
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18 }}
              >
                <Alena3DAvatar state={alenaState} emotion={emotion} size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badge */}
          {!isOpen &&
            (unreadCount > 0 ? (
              <ActiveDot count={unreadCount} />
            ) : isBusy || hasConversation ? (
              <ActiveDot />
            ) : null)}
        </div>
      </motion.button>
    </>
  );
}
