import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { robotApi, ChatMessage, ToolExecution } from "@/api/robot.api";
import { useVoiceInput } from "./use-voice-input";
import { useVoiceOutput } from "./use-voice-output";
import { alenaStateMachine, AlenaState, AlenaEmotion } from "@/services/alenaStateMachine";
import { alenaRealtimeService } from "@/services/alenaRealtimeService";
import { wakeWordEngine } from "@/services/wakeWordEngine";

export type { AlenaState, AlenaEmotion };

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolExecutions?: ToolExecution[];
  isProcessing?: boolean;
}

export function useAlena() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const queryClient = useQueryClient();

  // Fetch user preferences (stale-while-revalidate, fast)
  const { data: prefs } = useQuery({
    queryKey: ["robot_preferences"],
    queryFn: robotApi.getPreferences,
    staleTime: 5 * 60 * 1000,
  });

  const wakeWordEnabled = prefs?.wakeWordEnabled ?? true;

  useEffect(() => {
    // Use a ref-guard so React StrictMode double-invoke doesn't disconnect on the
    // first unmount and then fail to reconnect on the second mount.
    let active = true;
    const token = localStorage.getItem("token");
    if (token && active) {
      alenaRealtimeService.connect(token);
    }
    return () => {
      active = false;
      // Only fully disconnect on a real unmount (not a StrictMode double-invoke).
      // A short delay allows the second mount cycle to reconnect cleanly.
      setTimeout(() => {
        if (!active) {
          alenaRealtimeService.disconnect();
        }
      }, 200);
    };
  }, []);

  // Sync with AlenaStateMachine
  const alenaState = useSyncExternalStore(
    alenaStateMachine.subscribe.bind(alenaStateMachine),
    () => alenaStateMachine.getState()
  );
  
  const emotion = useSyncExternalStore(
    alenaStateMachine.subscribe.bind(alenaStateMachine),
    () => alenaStateMachine.getEmotion()
  );

  const statusLabel = useSyncExternalStore(
    alenaStateMachine.subscribe.bind(alenaStateMachine),
    () => alenaStateMachine.getStatusLabel()
  );

  // Voice Hooks
  const {
    isSupported: isVoiceOutSupported,
    isSpeaking,
    voiceEnabled,
    toggleVoice,
    speak,
    stopSpeaking,
  } = useVoiceOutput();

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const speakRef = useRef(speak);
  speakRef.current = speak;

  const sendMessageRef = useRef<(text: string) => void>(() => {});

  const handleTranscript = useCallback((text: string) => {
    setInputValue(text);
    sendMessageRef.current(text);
  }, []);

  const handleVoiceError = useCallback((err: string) => {
    alenaStateMachine.transitionTo("ERROR", err);
    setTimeout(() => {
      alenaStateMachine.transitionTo("IDLE", "");
    }, 3000);
  }, []);

  const {
    isSupported: isVoiceInSupported,
    isListening,
    startListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  });

  // Natural Interruption Support
  const handleWakeWord = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking(); // Interrupt Alena's current speech
    }
    if (!isOpen) {
      setIsOpen(true);
    }
    startListening();
  }, [isSpeaking, stopSpeaking, isOpen, startListening]);

  useEffect(() => {
    if (!wakeWordEnabled) {
      wakeWordEngine.stopListening();
      return;
    }
    // Only listen for wake word if we are not actively listening for a command
    if (!isListening) {
      wakeWordEngine.startListening(handleWakeWord);
    } else {
      wakeWordEngine.stopListening();
    }
    return () => {
      wakeWordEngine.stopListening();
    };
  }, [isListening, handleWakeWord, wakeWordEnabled]);

  // Sync voice input state
  useEffect(() => {
    if (isListening) {
      alenaStateMachine.transitionTo("LISTENING", "Listening...");
    } else if (alenaState === "LISTENING") {
      alenaStateMachine.transitionTo("IDLE", "");
    }
  }, [isListening]);

  // Sync voice output state
  useEffect(() => {
    if (isSpeaking && alenaState === "COMPLETED") {
      alenaStateMachine.transitionTo("SPEAKING");
    } else if (!isSpeaking && alenaState === "SPEAKING") {
      alenaStateMachine.transitionTo("IDLE");
    }
  }, [isSpeaking]);

  const processingMsgIdRef = useRef<string | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    alenaStateMachine.transitionTo("IDLE");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    alenaStateMachine.transitionTo("IDLE");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || alenaState === "THINKING" || alenaState === "WORKING") return;

      const userMsg: ConversationMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const processingMsgId = crypto.randomUUID();
      processingMsgIdRef.current = processingMsgId;
      const processingMsg: ConversationMessage = {
        id: processingMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isProcessing: true,
      };

      setConversation((prev) => [...prev, userMsg, processingMsg]);
      alenaStateMachine.transitionTo("THINKING", "Thinking…");
      setInputValue("");

      try {
        const historyForApi: ChatMessage[] = [
          ...conversation.slice(-18).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: text.trim() },
        ];

        const response = await robotApi.chat(historyForApi);

        if (response.toolExecutions?.length > 0) {
          const lastTool = response.toolExecutions[response.toolExecutions.length - 1];
          alenaStateMachine.setStatusLabel(lastTool.label);
        }

        alenaStateMachine.transitionTo("COMPLETED"); // We use COMPLETED instead of RESPONDING

        setConversation((prev) =>
          prev.map((m) =>
            m.id === processingMsgId
              ? {
                  ...m,
                  content: response.reply,
                  toolExecutions: response.toolExecutions,
                  isProcessing: false,
                }
              : m
          )
        );

        const taskModifyingTools = ["createTask", "updateTask", "completeTask", "deleteTask"];
        const didModifyTasks = response.toolExecutions?.some((te) =>
          taskModifyingTools.includes(te.tool)
        );
        if (didModifyTasks) {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }

        if (voiceEnabledRef.current && response.reply) {
          speakRef.current(response.reply);
        }

        alenaStateMachine.transitionTo("COMPLETED", "Done!");
        setTimeout(() => {
          if (alenaStateMachine.getState() === "COMPLETED") {
             alenaStateMachine.transitionTo("IDLE", "");
          }
        }, 1500);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || "Something went wrong. Please try again.";
        alenaStateMachine.transitionTo("ERROR", errorMsg);

        setConversation((prev) =>
          prev.map((m) =>
            m.id === processingMsgId
              ? {
                  ...m,
                  content: errorMsg,
                  isProcessing: false,
                }
              : m
          )
        );

        setTimeout(() => {
          alenaStateMachine.transitionTo("IDLE", "");
        }, 3000);
      }
    },
    [alenaState, conversation, queryClient]
  );

  sendMessageRef.current = sendMessage;

  const clearConversation = useCallback(() => {
    setConversation([]);
    alenaStateMachine.transitionTo("IDLE", "");
    stopSpeaking();
  }, [stopSpeaking]);

  const setProactiveState = useCallback((message: string) => {
    alenaStateMachine.transitionTo("PROACTIVE_NOTIFICATION", message);
    setTimeout(() => {
      alenaStateMachine.transitionTo("IDLE", "");
    }, 4000);
  }, []);

  return {
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
    setProactiveState,
  };
}
