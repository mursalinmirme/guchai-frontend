export type AlenaState = 
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "WORKING"
  | "SPEAKING"
  | "WAITING_FOR_USER"
  | "PROACTIVE_NOTIFICATION"
  | "COMPLETED"
  | "ERROR";

export type AlenaEmotion =
  | "NEUTRAL"
  | "CALM"
  | "FRIENDLY"
  | "HAPPY"
  | "FOCUSED"
  | "THINKING"
  | "ENCOURAGING"
  | "CONCERNED"
  | "EXCITED"
  | "CONFIDENT"
  | "ERROR";

type Listener = (state: AlenaState, emotion: AlenaEmotion, statusLabel: string) => void;

class AlenaStateMachine {
  private state: AlenaState = "IDLE";
  private emotion: AlenaEmotion = "CALM";
  private statusLabel: string = "";
  private listeners: Set<Listener> = new Set();

  public getState() { return this.state; }
  public getEmotion() { return this.emotion; }
  public getStatusLabel() { return this.statusLabel; }

  public transitionTo(newState: AlenaState, label?: string, newEmotion?: AlenaEmotion) {
    let changed = false;
    
    if (this.state !== newState) {
      this.state = newState;
      changed = true;
    }

    if (label !== undefined && this.statusLabel !== label) {
      this.statusLabel = label;
      changed = true;
    }

    const emotionToSet = newEmotion || this.deriveEmotion(newState);
    if (this.emotion !== emotionToSet) {
      this.emotion = emotionToSet;
      changed = true;
    }

    if (changed) {
      this.notify();
    }
  }

  public setEmotion(newEmotion: AlenaEmotion) {
    if (this.emotion !== newEmotion) {
      this.emotion = newEmotion;
      this.notify();
    }
  }
  
  public setStatusLabel(label: string) {
    if (this.statusLabel !== label) {
      this.statusLabel = label;
      this.notify();
    }
  }

  private deriveEmotion(state: AlenaState): AlenaEmotion {
    switch (state) {
      case "IDLE": return "CALM";
      case "LISTENING": return "FOCUSED";
      case "THINKING": return "THINKING";
      case "WORKING": return "FOCUSED";
      case "SPEAKING": return "FRIENDLY";
      case "COMPLETED": return "HAPPY";
      case "ERROR": return "ERROR";
      case "PROACTIVE_NOTIFICATION": return "CONCERNED";
      case "WAITING_FOR_USER": return "NEUTRAL";
      default: return "NEUTRAL";
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state, this.emotion, this.statusLabel));
  }
}

export const alenaStateMachine = new AlenaStateMachine();
