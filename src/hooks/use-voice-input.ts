import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseVoiceInputProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;  // real-time partial text
  onError?: (err: string) => void;
}

export function useVoiceInput({ onTranscript, onInterim, onError }: UseVoiceInputProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Stable recognition instance — created once, never recreated
  const recognitionRef = useRef<any>(null);
  // Refs for callbacks so the recognition handlers always call the latest version
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onInterimRef.current = onInterim;
  onErrorRef.current = onError;

  // Track whether we're in a "listening" session to prevent double-starts
  const isListeningRef = useRef(false);
  // Auto-retry counter on no-speech
  const noSpeechRetryRef = useRef(0);
  const MAX_NO_SPEECH_RETRIES = 1;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    // ── Configuration for best accuracy ──────────────────────
    recognition.continuous = false;
    recognition.interimResults = true;   // real-time partial results
    recognition.maxAlternatives = 3;     // consider up to 3 interpretations
    recognition.lang = "en-US";

    // ── Event handlers ─────────────────────────────────────────
    recognition.onstart = () => {
      isListeningRef.current = true;
      noSpeechRetryRef.current = 0;
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          // Among all alternatives, pick the one with the highest confidence
          let bestAlt = result[0];
          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > bestAlt.confidence) {
              bestAlt = result[j];
            }
          }

          // Confidence threshold — ignore very uncertain results
          if (bestAlt.confidence >= 0.45 || bestAlt.transcript.trim().length > 0) {
            finalTranscript += bestAlt.transcript;
          }
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Fire interim callback for live feedback in UI
      if (interimTranscript && onInterimRef.current) {
        onInterimRef.current(interimTranscript);
      }

      // Fire final transcript
      if (finalTranscript.trim()) {
        onTranscriptRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;

      if (error === "no-speech") {
        // Auto-retry once on no-speech before giving up
        if (noSpeechRetryRef.current < MAX_NO_SPEECH_RETRIES && isListeningRef.current) {
          noSpeechRetryRef.current++;
          try {
            recognition.start();
            return; // Don't set isListening=false yet
          } catch {
            // Fall through to stop
          }
        }
        // Give up quietly after retries
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }

      isListeningRef.current = false;
      setIsListening(false);

      let errorMsg = "Microphone error.";
      if (error === "not-allowed" || error === "service-not-allowed") {
        errorMsg = "Microphone access denied. Please allow microphone permission.";
      } else if (error === "audio-capture") {
        errorMsg = "No microphone found. Please connect a microphone.";
      } else if (error === "network") {
        errorMsg = "Network error during speech recognition.";
      } else if (error === "aborted") {
        // User manually stopped — not an error
        return;
      }

      if (onErrorRef.current) onErrorRef.current(errorMsg);
      else toast.error(errorMsg);
    };

    recognition.onend = () => {
      // Only update state if we intentionally stopped (not mid-retry)
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, []); // ← Empty deps: create the instance exactly once

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    if (!recognitionRef.current || isListeningRef.current) return;

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("[voice-input] Could not start recognition:", e);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  return { isSupported, isListening, startListening, stopListening };
}
