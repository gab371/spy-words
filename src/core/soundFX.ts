const MUTE_STORAGE_KEY = "p2play:sound:muted";

/**
 * Synthesized sound effects for Spy Words.
 * All sounds generated on the fly via the Web Audio API — no audio assets.
 * Mute preference is persisted in localStorage and shared across all
 * P2Play games and the Hub (key `p2play:sound:muted`).
 */
export class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor() {
    try {
      const stored = localStorage.getItem(MUTE_STORAGE_KEY);
      if (stored !== null) this.enabled = stored !== "true";
    } catch {
      /* localStorage may be unavailable */
    }
  }

  public init(): void {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(!enabled));
    } catch {
      /* ignore */
    }
  }

  private beep(
    freq: number,
    dur: number,
    type: OscillatorType = "sine",
    vol = 0.15,
  ): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  playClick(): void {
    this.beep(660, 0.05);
  }

  playPing(): void {
    this.beep(880, 0.2);
  }

  /** Mastermind reveals a clue — soft chime. */
  playClue(): void {
    this.beep(520, 0.12, "triangle", 0.18);
    setTimeout(() => this.beep(720, 0.15, "triangle", 0.16), 90);
  }

  /** Card revealed as the active team's color — crisp tap. */
  playReveal(): void {
    this.beep(540, 0.08, "square", 0.18);
  }

  /** Wrong-team / neutral card — low thunk. */
  playWrong(): void {
    this.beep(220, 0.18, "sine", 0.2);
  }

  /** Assassin card — alarming descending tone. */
  playAssassin(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.7);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.71);
  }

  playVictory(): void {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.25, "sine", 0.2), i * 120),
    );
  }

  playDefeat(): void {
    this.beep(200, 0.4, "sine", 0.22);
  }
}

export const soundManager = new SoundFX();