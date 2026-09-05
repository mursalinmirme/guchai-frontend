import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { robotApi } from "@/api/robot.api";

// Simple markdown stripper for voice output
function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    // Remove bold/italic markers
    .replace(/[*_~]+/g, "")
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers
    .replace(/^#+\s+/gm, "")
    // Remove code blocks
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    // Clean up tables — just remove the | and structural lines
    .replace(/\|/g, "")
    .replace(/[-:]+-/g, "")
    .trim();
}

export function useVoiceOutput() {
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize and sync preferences
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    } else {
      setIsSupported(false);
    }
    
    // Load preference from backend instead of just localStorage
    robotApi.getPreferences().then(prefs => {
      setVoiceEnabled(!!prefs.voiceEnabled);
    }).catch(() => {
      // Fallback
      setVoiceEnabled(localStorage.getItem("guchai_voice_enabled") === "true");
    });
  }, []);

  const toggleVoice = useCallback(async () => {
    if (!isSupported) {
      toast.error("Voice output is not supported in this browser.");
      return;
    }
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    localStorage.setItem("guchai_voice_enabled", String(newVal));
    
    // Attempt to persist to backend
    try {
      await robotApi.updatePreferences({ voiceEnabled: newVal });
    } catch {
      // It's ok if it fails, we have local state
    }
    
    toast.success(`Voice responses ${newVal ? "enabled" : "disabled"}`);
  }, [voiceEnabled, isSupported]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !isSupported || !synthRef.current) return;
    
    // Stop any current speech
    synthRef.current.cancel();
    
    const cleanText = stripMarkdown(text);
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a good voice (prefer Google US English or similar)
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Google") && v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en"));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.05; // Slightly faster than default
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [voiceEnabled, isSupported]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return {
    isSupported,
    isSpeaking,
    voiceEnabled,
    toggleVoice,
    speak,
    stopSpeaking,
  };
}
