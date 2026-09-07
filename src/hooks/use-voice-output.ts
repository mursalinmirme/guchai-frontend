import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { robotApi } from "@/api/robot.api";

// ─────────────────────────────────────────────────────────────
// Markdown stripper — produces clean, natural-sounding prose
// ─────────────────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  if (!text) return "";
  return (
    text
      // Remove fenced code blocks entirely (not useful to read aloud)
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`[^`]+`/g, "")
      // Remove bold/italic markers but keep the text
      .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
      // Remove links — keep just the label
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      // Remove ATX headings markers, keep text
      .replace(/^#+\s+/gm, "")
      // Remove table separator rows (---|---) and pipe chars
      .replace(/^[\s|:-]+$/gm, "")
      .replace(/\|/g, " ")
      // Collapse excess whitespace / blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function useVoiceOutput() {
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  // Cached voices — populated once onvoiceschanged fires (Chrome) or immediately (Firefox)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // Chrome resume-bug workaround interval
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Pending utterance to retry after voices load
  const pendingSpeakRef = useRef<string | null>(null);
  // Always-current voiceEnabled value without stale closure
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // ── Pick best English voice from cached list ──────────────
  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (!voices.length) return null;
    return (
      voices.find((v) => v.name.includes("Google") && v.lang === "en-US") ||
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }, []);

  // ── Core speak routine ────────────────────────────────────
  const speakImmediate = useCallback(
    (cleanText: string) => {
      const synth = synthRef.current;
      if (!synth) return;

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Chrome pauses speechSynthesis after ~15s or on tab blur.
        // Calling pause()+resume() periodically prevents silent stops.
        resumeIntervalRef.current = setInterval(() => {
          if (synthRef.current?.speaking) {
            synthRef.current.pause();
            synthRef.current.resume();
          }
        }, 10_000);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current);
          resumeIntervalRef.current = null;
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") {
          console.warn("[voice-output] error:", e.error);
        }
        setIsSpeaking(false);
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current);
          resumeIntervalRef.current = null;
        }
      };

      synth.speak(utterance);
    },
    [pickVoice]
  );

  // ── Populate voicesRef and flush pending utterance ────────
  const loadVoices = useCallback(() => {
    if (!synthRef.current) return;
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      voicesRef.current = voices;
      if (pendingSpeakRef.current && voiceEnabledRef.current) {
        const text = pendingSpeakRef.current;
        pendingSpeakRef.current = null;
        setTimeout(() => speakImmediate(text), 50);
      }
    }
  }, [speakImmediate]);

  // ── Public speak() ────────────────────────────────────────
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabledRef.current || !isSupported || !synthRef.current) return;
      const cleanText = stripMarkdown(text);
      if (!cleanText) return;

      // Voices not yet loaded — queue and wait for onvoiceschanged
      if (voicesRef.current.length === 0) {
        pendingSpeakRef.current = cleanText;
        synthRef.current.getVoices(); // trigger load in Chrome
        return;
      }

      speakImmediate(cleanText);
    },
    [isSupported, speakImmediate]
  );

  // ── Initialization ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    robotApi
      .getPreferences()
      .then((prefs) => setVoiceEnabled(!!prefs.voiceEnabled))
      .catch(() => {
        setVoiceEnabled(localStorage.getItem("guchai_voice_enabled") === "true");
      });

    return () => {
      synth.onvoiceschanged = null;
      synth.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
  }, [loadVoices]);

  // ── Toggle ────────────────────────────────────────────────
  const toggleVoice = useCallback(async () => {
    if (!isSupported) {
      toast.error("Voice output is not supported in this browser.");
      return;
    }
    const newVal = !voiceEnabledRef.current;
    setVoiceEnabled(newVal);
    localStorage.setItem("guchai_voice_enabled", String(newVal));

    if (!newVal && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      await robotApi.updatePreferences({ voiceEnabled: newVal });
    } catch {
      // local state is source of truth
    }

    toast.success(`Voice responses ${newVal ? "enabled" : "disabled"}`);
  }, [isSupported]);

  // ── Stop ─────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  }, []);

  return { isSupported, isSpeaking, voiceEnabled, toggleVoice, speak, stopSpeaking };
}
