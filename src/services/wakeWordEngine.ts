export type WakeWordCallback = () => void;

export interface IWakeWordEngine {
  isSupported: boolean;
  startListening(onWakeWord: WakeWordCallback): void;
  stopListening(): void;
}

/**
 * A browser-native Wake Word engine using the Web Speech API.
 *
 * Privacy note: this sends audio to the browser's speech recognition service
 * (e.g. Google Chrome's cloud speech). For truly offline / private detection,
 * replace this with a local TF.js or WASM-based model.
 *
 * The engine automatically restarts continuous recognition so it stays always-on,
 * but only while `wantListening` is true — preventing the InvalidStateError race
 * condition where `onend` fires after an explicit `stop()` and tries to restart.
 */
class BrowserWakeWordEngine implements IWakeWordEngine {
  public isSupported: boolean = false;
  private recognition: any = null;
  private wantListening: boolean = false; // desired state (set before calling .start/.stop)
  private onWakeWordCb: WakeWordCallback | null = null;
  private readonly WAKE_WORDS = [
    "hey alena",
    "hi alena",
    "okay alena",
    "ok alena",
    "alena",
    "hi doc",
    "hey doc",
    "doc",
  ];

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    this.isSupported = true;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (!this.wantListening) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        for (const word of this.WAKE_WORDS) {
          if (transcript.includes(word)) {
            console.log(`[WakeWordEngine] Detected: "${transcript}"`);
            // Stop BEFORE calling the callback so the callback can startListening() fresh
            this.stopListening();
            this.onWakeWordCb?.();
            return;
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.warn("[WakeWordEngine] Mic permission denied. Disabling wake word.");
        this.wantListening = false;
      }
      // For other errors (network, no-speech, aborted), onend will handle restarting
    };

    recognition.onend = () => {
      // Only auto-restart if we still *want* to be listening
      // (i.e. stopListening() was NOT explicitly called)
      if (this.wantListening) {
        try {
          recognition.start();
        } catch (e) {
          // Can happen briefly during browser tab changes — ignore
          console.warn("[WakeWordEngine] Auto-restart failed:", (e as Error).message);
        }
      }
    };

    this.recognition = recognition;
  }

  public startListening(onWakeWord: WakeWordCallback): void {
    if (!this.isSupported) return;

    this.onWakeWordCb = onWakeWord;

    if (this.wantListening) return; // already running, update callback only

    this.wantListening = true;

    try {
      this.recognition.start();
      console.log("[WakeWordEngine] Listening for wake word…");
    } catch (e: any) {
      if (e.name === "InvalidStateError") {
        // Recognition was already running from a previous cycle — that's fine,
        // onend+restart will keep it alive. Just update the flag.
        console.warn("[WakeWordEngine] Already running, skipping redundant start().");
      } else {
        console.error("[WakeWordEngine] Start error:", e);
        this.wantListening = false;
      }
    }
  }

  public stopListening(): void {
    if (!this.isSupported) return;
    if (!this.wantListening) return; // already stopped, avoid double-stop

    this.wantListening = false; // must be set BEFORE calling .abort() so onend doesn't restart

    try {
      this.recognition.abort();
      console.log("[WakeWordEngine] Stopped listening.");
    } catch {
      // ignore — already stopped
    }
  }
}

export const wakeWordEngine = new BrowserWakeWordEngine();
