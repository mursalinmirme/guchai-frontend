import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { robotApi, ChatMessage, ToolExecution } from "@/api/robot.api";

// ─────────────────────────────────────────────────────────────
// Robot State Machine
// ─────────────────────────────────────────────────────────────

export type RobotState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "PROCESSING"
  | "RESPONDING"
  | "SUCCESS"
  | "ERROR";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolExecutions?: ToolExecution[];
  isProcessing?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useRobot() {
  const [isOpen, setIsOpen] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>("IDLE");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [statusLabel, setStatusLabel] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const queryClient = useQueryClient();

  const processingMsgIdRef = useRef<string | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setRobotState("IDLE");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setRobotState("IDLE");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || robotState === "THINKING" || robotState === "PROCESSING") return;

      const userMsg: ConversationMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      // Placeholder for assistant response while loading
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
      setRobotState("THINKING");
      setStatusLabel("Thinking…");
      setInputValue("");

      try {
        // Build message history for the API (last 20 messages for context)
        const historyForApi: ChatMessage[] = [
          ...conversation.slice(-18).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: text.trim() },
        ];

        // Update status as tools start running
        const statusInterval = setInterval(() => {
          setRobotState((prev) => {
            if (prev === "THINKING") return "PROCESSING";
            return prev;
          });
          setStatusLabel((prev) => {
            if (prev === "Thinking…") return "Processing…";
            return prev;
          });
        }, 1200);

        const response = await robotApi.chat(historyForApi);

        clearInterval(statusInterval);

        // Update the processing tool label during execution
        if (response.toolExecutions?.length > 0) {
          const lastTool = response.toolExecutions[response.toolExecutions.length - 1];
          setStatusLabel(lastTool.label);
        }

        setRobotState("RESPONDING");

        // Replace the processing placeholder with the actual response
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

        // Invalidate task queries so the UI stays in sync after Robot actions
        const taskModifyingTools = ["createTask", "updateTask", "completeTask", "deleteTask"];
        const didModifyTasks = response.toolExecutions?.some((te) =>
          taskModifyingTools.includes(te.tool)
        );
        if (didModifyTasks) {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }

        // Briefly show success, then return to idle
        setRobotState("SUCCESS");
        setStatusLabel("Done!");
        setTimeout(() => {
          setRobotState("IDLE");
          setStatusLabel("");
        }, 1500);
      } catch (err: any) {
        setRobotState("ERROR");
        const errorMsg = err?.response?.data?.message || "Something went wrong. Please try again.";
        setStatusLabel(errorMsg);

        // Replace processing placeholder with error message
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
          setRobotState("IDLE");
          setStatusLabel("");
        }, 3000);
      }
    },
    [robotState, conversation, queryClient]
  );

  const clearConversation = useCallback(() => {
    setConversation([]);
    setRobotState("IDLE");
    setStatusLabel("");
  }, []);

  return {
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
  };
}
