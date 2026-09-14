import { motion } from "framer-motion";
import type { AlenaEmotion } from "@/hooks/use-alena";

interface VoiceVisualizerProps {
  isActive: boolean;      // true when speaking or listening
  emotion: AlenaEmotion;
  mode: "listening" | "speaking" | "idle";
  barCount?: number;
}

function getEmotionColor(emotion: AlenaEmotion): string {
  switch (emotion) {
    case "HAPPY":
    case "EXCITED":    return "#22d3ee";
    case "CALM":
    case "NEUTRAL":    return "#818cf8";
    case "FRIENDLY":   return "#34d399";
    case "FOCUSED":
    case "CONFIDENT":  return "#60a5fa";
    case "THINKING":   return "#a78bfa";
    case "ENCOURAGING":return "#fb923c";
    case "CONCERNED":  return "#fbbf24";
    case "ERROR":      return "#f87171";
    default:           return "#818cf8";
  }
}

export function VoiceVisualizer({ isActive, emotion, mode, barCount = 24 }: VoiceVisualizerProps) {
  const color = getEmotionColor(emotion);

  if (!isActive || mode === "idle") {
    // Flat idle line
    return (
      <div className="flex items-center justify-center gap-px" style={{ height: 24, width: "100%" }}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            style={{ width: 2, height: 2, borderRadius: 1, background: `${color}44` }}
          />
        ))}
      </div>
    );
  }

  if (mode === "listening") {
    // Inward ripple: bars grow from center outward based on microphone energy (simulated with stagger)
    const center = barCount / 2;
    return (
      <div className="flex items-center justify-center gap-px" style={{ height: 24, width: "100%" }}>
        {Array.from({ length: barCount }).map((_, i) => {
          const distFromCenter = Math.abs(i - center) / center;
          const maxH = 20 - distFromCenter * 14;
          const delay = distFromCenter * 0.25;
          return (
            <motion.div
              key={i}
              style={{ width: 2, borderRadius: 1, background: color, boxShadow: `0 0 3px ${color}66` }}
              animate={{ height: [2, maxH, 2] }}
              transition={{ duration: 0.7, repeat: Infinity, delay, ease: "easeInOut" }}
            />
          );
        })}
      </div>
    );
  }

  // Speaking: randomized bar heights, energetic waveform
  const speakingHeights = Array.from({ length: barCount }, (_, i) => {
    const x = i / barCount;
    // Create a smooth wave envelope
    const envelope = Math.sin(x * Math.PI);
    return Math.max(2, Math.round(envelope * 18));
  });

  return (
    <div className="flex items-center justify-center gap-px" style={{ height: 24, width: "100%" }}>
      {speakingHeights.map((maxH, i) => (
        <motion.div
          key={i}
          style={{ width: 2, borderRadius: 1, background: color, boxShadow: `0 0 4px ${color}55` }}
          animate={{ height: [2, maxH * 0.6, maxH, maxH * 0.4, 2] }}
          transition={{ duration: 0.4 + (i % 3) * 0.1, repeat: Infinity, delay: (i * 0.04) % 0.4, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
