import { SpyWordsEngine } from "./core/gameEngine";
import type { CodenamesCard, GamePhase, PlayerRole, TeamColor } from "./core/types";

/**
 * Test hooks for Spy Words E2E tests.
 *
 * Exposed on `window.__testHooks__` ONLY in non-production builds (Playwright
 * runs `vite` in dev mode, so the hooks are present during tests; the prod
 * build strips them). Determinism comes from forcing the grid/phase and
 * driving the live engine via `act` — no seeded RNG, no PeerJS, no 2nd browser
 * context. See docs/plans/06_tests_e2e_par_jeu/plan.md (Idea 6, Step 2).
 */
declare global {
  interface Window {
    __testHooks__?: SpyWordsTestHooks;
  }
}

export interface SpyWordsTestHooks {
  /** Create a fresh standalone engine (no PeerJS) and register it. */
  createEngine(): unknown;
  /** Force the 25-card grid (cards with known colors, all unrevealed). */
  forceGrid(cards: CodenamesCard[], startingTeam: TeamColor): void;
  /** Force a player's team and role. */
  setPlayerTeamRole(
    playerId: string,
    team: TeamColor,
    role: PlayerRole,
  ): void;
  /** Force the engine phase. */
  setPhase(phase: GamePhase): void;
  /** Call an engine method by name with args. */
  act(method: string, args: unknown[]): unknown;
  /** Read the live engine state. */
  getState(): unknown;
  /** Get the live engine instance (or null). */
  getEngine(): SpyWordsEngine | null;
}

let engineGetter: (() => SpyWordsEngine | null) | null = null;
let testEngine: SpyWordsEngine | null = null;

/** Called from useGame to expose the live engine ref to the test hooks. */
export function registerEngineGetter(getter: () => SpyWordsEngine | null): void {
  engineGetter = getter;
}

function liveEngine(): SpyWordsEngine | null {
  return testEngine ?? engineGetter?.() ?? null;
}

export function installTestHooks(): void {
  if (typeof window === "undefined") return;
  if (import.meta.env.PROD) return; // never expose in production builds
  if (window.__testHooks__) return; // idempotent

  window.__testHooks__ = {
    createEngine: () => {
      testEngine = new SpyWordsEngine();
      return testEngine.state;
    },
    forceGrid: (cards, startingTeam) => {
      const engine = liveEngine();
      if (!engine) return;
      engine.state.cards = cards.map((c) => ({ ...c }));
      engine.state.startingTeam = startingTeam;
      engine.state.activeTeam = startingTeam;
      engine.state.redRemaining = cards.filter((c) => c.color === "RED").length;
      engine.state.blueRemaining = cards.filter((c) => c.color === "BLUE").length;
    },
    setPlayerTeamRole: (playerId, team, role) => {
      const engine = liveEngine();
      const p = engine?.state.players.find((pl) => pl.id === playerId);
      if (p) {
        p.team = team;
        p.role = role;
      }
    },
    setPhase: (phase) => {
      const engine = liveEngine();
      if (engine) (engine.state as unknown as { phase: GamePhase }).phase = phase;
    },
    act: (method, args) => {
      const engine = liveEngine();
      if (!engine) return undefined;
      const fn = (
        engine as unknown as Record<string, (...a: unknown[]) => unknown>
      )[method];
      if (typeof fn !== "function") return undefined;
      return fn.apply(engine, args);
    },
    getState: () => liveEngine()?.state ?? null,
    getEngine: () => liveEngine(),
  };
}