import { alenaStateMachine } from "./alenaStateMachine";

class AlenaRealtimeService {
  private eventSource: EventSource | null = null;
  private isConnecting: boolean = false;

  public connect(token: string) {
    if (this.eventSource || this.isConnecting) return;
    this.isConnecting = true;

    // VITE_API_URL is the full API base (e.g. "http://localhost:5000/api").
    // Strip the trailing /api if present to get the server origin for the SSE path.
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const serverOrigin = apiBase.replace(/\/api\/?$/, "");

    // Pass token as query param — EventSource cannot set Authorization headers.
    const streamUrl = `${serverOrigin}/api/robot/stream?token=${encodeURIComponent(token)}`;

    this.eventSource = new EventSource(streamUrl);

    this.eventSource.onopen = () => {
      console.log("[AlenaRealtime] Connected to assistant stream via SSE.");
      this.isConnecting = false;
    };

    this.eventSource.onerror = (err) => {
      console.error("[AlenaRealtime] Connection error:", err);
      this.isConnecting = false;
      // Depending on severity, we might want to close and retry
    };

    // ─────────────────────────────────────────────────────────────
    // Assistant Events
    // ─────────────────────────────────────────────────────────────

    this.eventSource.addEventListener("connected", (event) => {
      console.log("[AlenaRealtime] SSE Connection established.", event.data);
    });

    this.eventSource.addEventListener("assistant.thinking", (event) => {
      if (alenaStateMachine.getState() !== "WORKING") {
        alenaStateMachine.transitionTo("THINKING", "Thinking...");
      }
    });

    this.eventSource.addEventListener("assistant.progress", (event) => {
      try {
        const data = JSON.parse(event.data);
        alenaStateMachine.transitionTo("WORKING", data.label);
      } catch (e) { }
    });

    this.eventSource.addEventListener("assistant.tool_completed", (event) => {
      // Just keep "Working..." until the next event
    });

    this.eventSource.addEventListener("assistant.notification", (event) => {
      try {
        const data = JSON.parse(event.data);
        alenaStateMachine.transitionTo("PROACTIVE_NOTIFICATION", data.title || data.message);
        setTimeout(() => {
          if (alenaStateMachine.getState() === "PROACTIVE_NOTIFICATION") {
             alenaStateMachine.transitionTo("IDLE", "");
          }
        }, 5000);
      } catch (e) { }
    });
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnecting = false;
      console.log("[AlenaRealtime] Disconnected SSE.");
    }
  }
}

export const alenaRealtimeService = new AlenaRealtimeService();
