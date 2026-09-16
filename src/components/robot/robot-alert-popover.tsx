import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Alena3DAvatar } from "./robot-3d-avatar";
import type { AlenaEmotion } from "@/hooks/use-alena";

interface RobotAlertPopoverProps {
  isOpen: boolean;
  message: string | null;
  emotion?: AlenaEmotion;
  onClose: () => void;
}

export function RobotAlertPopover({ isOpen, message, emotion = "NEUTRAL", onClose }: RobotAlertPopoverProps) {
  return (
    <AnimatePresence>
      {isOpen && message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-[90px] right-4 z-50 lg:bottom-[100px] flex items-center gap-4 rounded-2xl shadow-2xl p-4 overflow-hidden"
          style={{
            maxWidth: 400,
            background: "linear-gradient(145deg, rgba(18,18,31,0.95), rgba(13,13,26,0.95))",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(129,140,248,0.2)",
          }}
        >
          {/* Avatar side */}
          <div className="shrink-0 relative">
            <Alena3DAvatar state="SPEAKING" emotion={emotion} size="sm" />
          </div>

          {/* Message side */}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand mb-1">
              Alena Alert
            </h4>
            <p className="text-sm text-text-main leading-snug">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-text-dim hover:text-white transition-colors"
            aria-label="Close alert"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
