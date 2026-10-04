import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { taskApi } from "@/api/task.api";
import type { AlenaEmotion } from "@/hooks/use-alena";

// Global alert state to trigger popover from anywhere
type AlertState = {
  isOpen: boolean;
  message: string | null;
  emotion: AlenaEmotion;
};

let listeners: ((state: AlertState) => void)[] = [];
let currentAlertState: AlertState = { isOpen: false, message: null, emotion: "NEUTRAL" };

export const alenaAlerts = {
  open: (message: string, emotion: AlenaEmotion = "SPEAKING" as any) => {
    currentAlertState = { isOpen: true, message, emotion };
    listeners.forEach((l) => l(currentAlertState));
    // Auto-close after 10 seconds if not interacted with (optional, user asked for default keeping it open, 
    // but a very long timeout is safe. Let's not auto-close for now per user feedback implied choice)
  },
  close: () => {
    currentAlertState = { ...currentAlertState, isOpen: false };
    listeners.forEach((l) => l(currentAlertState));
  },
  subscribe: (listener: (state: AlertState) => void) => {
    listeners.push(listener);
    listener(currentAlertState);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }
};

export function useAlenaAlertPopover() {
  const [state, setState] = useState(currentAlertState);
  useEffect(() => alenaAlerts.subscribe(setState), []);
  return { ...state, close: alenaAlerts.close };
}

// Global speak reference so dashboard can trigger voice without duplicating hooks
export let globalSpeak: ((text: string) => void) | null = null;

export const triggerWelcome = () => {
  const lastWelcome = sessionStorage.getItem("alena_last_welcome");
  const now = Date.now();
  // 1-minute cooldown
  if (lastWelcome && now - parseInt(lastWelcome, 10) < 60000) return;

  sessionStorage.setItem("alena_last_welcome", now.toString());

  const greetings = [
    "Welcome back! I am Alena, your AI assistant. How can I help you today?",
    "Hello again! I am Alena. Let's get to work.",
    "Greetings! I am Alena, your personal AI. Ready when you are.",
    "Good to see you! I am Alena. What are we tackling today?",
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Speak directly via Web Speech API (bypasses voiceEnabled guard)
  // so the greeting always plays as a system announcement.
  const doSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.rate = 0.85; // Slower for more human-like pacing
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick best English voice if available
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.name.includes("Microsoft Jenny Online (Natural)")) ||
      voices.find((v) => v.name.includes("Microsoft Aria Online (Natural)")) ||
      voices.find((v) => v.name.includes("Siri") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Samantha")) ||
      voices.find((v) => (v.name.includes("Natural") || v.name.includes("Neural")) && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (voice) utterance.voice = voice;

    synth.speak(utterance);
  };

  // Voices may not be loaded yet in Chrome — retry up to 3 times
  const trySpeak = (attempts = 0) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 || attempts >= 3) {
      doSpeak();
    } else {
      setTimeout(() => trySpeak(attempts + 1), 300);
    }
  };

  trySpeak();
};

// Polling hook to check tasks and trigger alerts
export function useAlenaProactiveAlerts(speak: (text: string) => void) {
  useEffect(() => {
    globalSpeak = speak;
  }, [speak]);

  // Use same query key & API as the dashboard tasks
  const today = new Date().toISOString().split("T")[0];
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", today],
    queryFn: () => taskApi.getTasksByDate(today),
    refetchInterval: 30000, // Refetch every 30s
  });

  const alertedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    
    tasks.forEach((task: any) => {
      if (task.status === "completed" || alertedTasks.current.has(task._id)) return;
      if (!task.planned_start) return;

      const plannedStart = new Date(task.planned_start);
      const diffMs = plannedStart.getTime() - now.getTime();
      const diffMinutes = diffMs / 60000;

      // 1. Upcoming alert (1-2 mins before)
      if (diffMinutes > 0 && diffMinutes <= 2) {
        const msg = `Your task "${task.title}" is starting in ${Math.ceil(diffMinutes)} minute${Math.ceil(diffMinutes) > 1 ? 's' : ''}.`;
        alertedTasks.current.add(task._id);
        alenaAlerts.open(msg, "ENCOURAGING" as any);
        speak(msg);
      }
      // 2. Arrived but not started alert (up to 5 mins past)
      else if (diffMinutes <= 0 && diffMinutes > -5 && task.status === "pending") {
        const msg = `It's time for "${task.title}". Whenever you're ready, let's get started.`;
        alertedTasks.current.add(task._id);
        alenaAlerts.open(msg, "FOCUSED" as any);
        speak(msg);
      }
    });
  }, [tasks, speak]);
}
