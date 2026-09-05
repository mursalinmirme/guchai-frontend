import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseVoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      let errorMsg = "Microphone error.";
      
      if (event.error === "not-allowed") {
        errorMsg = "Microphone access denied.";
      } else if (event.error === "no-speech") {
        // Just quietly stop if no speech is detected
        return; 
      }
      
      if (onError) onError(errorMsg);
      else toast.error(errorMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Catch any DOMExceptions (e.g. starting when already started)
        console.error("Speech recognition error:", e);
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
}
