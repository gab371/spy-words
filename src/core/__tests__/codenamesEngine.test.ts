import { describe, expect, it } from "vitest";
import { SpyWordsEngine } from "../gameEngine";
import type { CodenamesCard, GameState, TeamColor } from "../types";
import { GRID_SIZE } from "../types";

/** Build a deterministic 25-card grid with a known color layout. */
function forcedCards(): CodenamesCard[] {
  const colors: CodenamesCard["color"][] = [
    ...Array(9).fill("RED"),
    ...Array(8).fill("BLUE"),
    ...Array(7).fill("NEUTRAL"),
    "ASSASSIN",
  ] as CodenamesCard["color"][];
  return Array.from({ length: GRID_SIZE }, (_, i) => ({
    id: `card_${i}`,
    word: `MOT${i}`,
    color: colors[i],
    revealed: false,
  }));
}

function makeEngine(): SpyWordsEngine {
  const e = new SpyWordsEngine();
  e.addPlayer("h", "Hôte", "🕵️", true);
  e.addPlayer("r1", "Rouge1", "🔴", false);
  e.addPlayer("b", "Bleu", "🔵", false);
  e.addPlayer("b1", "Bleu1", "🔷", false);
  // Assign teams + roles: RED mastermind = h, agent = r1 ; BLUE mastermind = b, agent = b1.
  e.setTeam("h", "RED");
  e.setRole("h", "MASTERMIND");
  e.setTeam("r1", "RED");
  e.setRole("r1", "AGENT");
  e.setTeam("b", "BLUE");
  e.setRole("b", "MASTERMIND");
  e.setTeam("b1", "BLUE");
  e.setRole("b1", "AGENT");
  return e;
}

/** Force the engine into GUESSING with the given clue team and a forced grid. */
function startWithForcedGrid(
  engine: SpyWordsEngine,
  startingTeam: TeamColor = "RED",
  clueWord = "Espion",
  clueCount = 2,
): void {
  engine.state.cards = forcedCards();
  engine.state.startingTeam = startingTeam;
  engine.state.activeTeam = startingTeam;
  engine.state.redRemaining = 9;
  engine.state.blueRemaining = 8;
  engine.state.phase = "GIVING_CLUE";
  engine.state.turnNonce += 1;
  const mastermindId = startingTeam === "RED" ? "h" : "b";
  const r = engine.submitClue(mastermindId, clueWord, clueCount);
  expect(r.ok).toBe(true);
}

describe("SpyWordsEngine — lobby & start", () => {
  it("refuses to start with fewer than 4 players", () => {
    const e = new SpyWordsEngine();
    e.addPlayer("a", "A", "x", true);
    expect(e.startGame()).toBe(false);
  });

  it("refuses to start without a mastermind per team", () => {
    const e = makeEngine();
    e.setRole("b", "AGENT");
    expect(e.startGame()).toBe(false);
  });

  it("requires readiness via setConfig lobby gating only", () => {
    const e = makeEngine();
    expect(e.setConfig({ timer: 60 })).toBe(true);
    expect(e.state.config.timer).toBe(60);
  });
});

describe("SpyWordsEngine — clue submission", () => {
  it("only the active team mastermind can submit a clue", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    // Wrong-team mastermind rejected.
    const r = e.submitClue("b", "Ocean", 1);
    expect(r.ok).toBe(false);
  });

  it("rejects invalid clue words (substring of an unrevealed word)", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    // MOT0 is unrevealed → "MOT0" must be rejected.
    const r = e.submitClue("h", "MOT0", 1);
    expect(r.ok).toBe(false);
  });

  it("accepts a fresh unrelated clue", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    // Move to BLUE turn by ending RED turn via reveal of a wrong card.
    e.state.activeTeam = "BLUE";
    e.state.phase = "GIVING_CLUE";
    e.state.turnNonce += 1;
    const r = e.submitClue("b", "Avalon", 1);
    expect(r.ok).toBe(true);
    expect(e.state.phase).toBe("GUESSING");
    expect(e.state.currentClue?.word).toBe("Avalon");
  });

  it("rejects count out of range", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    expect(e.submitClue("h", "Ocean", -1).ok).toBe(false);
    expect(e.submitClue("h", "Ocean", 12).ok).toBe(false);
  });
});

describe("SpyWordsEngine — guesses & turn flow", () => {
  it("agents of the active team can reveal correct cards and keep guessing", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    const r = e.revealCard("r1", "card_0"); // RED card
    expect(r.ok).toBe(true);
    expect(e.state.redRemaining).toBe(8);
    expect(e.state.phase).toBe("GUESSING");
  });

  it("neutral card ends the turn", () => {
    const e = makeEngine();
    // card_17 is NEUTRAL (index 17: 9+8 = 17 → first NEUTRAL)
    startWithForcedGrid(e, "RED");
    const r = e.revealCard("r1", "card_17");
    expect(r.ok).toBe(true);
    expect(e.state.phase).toBe("GIVING_CLUE");
    expect(e.state.activeTeam).toBe("BLUE");
  });

  it("opponent card ends the turn", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    // card_9 is BLUE (indices 9..16).
    const r = e.revealCard("r1", "card_9");
    expect(r.ok).toBe(true);
    expect(e.state.phase).toBe("GIVING_CLUE");
    expect(e.state.activeTeam).toBe("BLUE");
  });

  it("assassin card ends the game and the other team wins", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    const r = e.revealCard("r1", "card_24"); // ASSASSIN
    expect(r.ok).toBe(true);
    expect(e.state.phase).toBe("GAME_OVER");
    expect(e.state.winnerTeam).toBe("BLUE");
    expect(e.state.lossCause).toBe("ASSASSIN");
  });

  it("exhausting a team's cards wins the game", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    e.state.redRemaining = 1;
    e.state.blueRemaining = 8;
    // Reveal the last RED card (card_0).
    const r = e.revealCard("r1", "card_0");
    expect(r.ok).toBe(true);
    expect(e.state.phase).toBe("GAME_OVER");
    expect(e.state.winnerTeam).toBe("RED");
    expect(e.state.lossCause).toBe(null);
  });

  it("quota = count+1 then auto-pass", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED", "Espion", 1); // quota = 2
    expect(e.revealCard("r1", "card_0").ok).toBe(true); // RED, guess 1
    expect(e.state.phase).toBe("GUESSING");
    expect(e.revealCard("r1", "card_1").ok).toBe(true); // RED, guess 2 → quota
    expect(e.state.phase).toBe("GIVING_CLUE");
    expect(e.state.activeTeam).toBe("BLUE");
  });

  it("mastermind cannot guess", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    expect(e.revealCard("h", "card_0").ok).toBe(false);
  });

  it("pass requires at least one guess", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    expect(e.passTurn("r1").ok).toBe(false);
    expect(e.revealCard("r1", "card_0").ok).toBe(true);
    expect(e.passTurn("r1").ok).toBe(true);
    expect(e.state.activeTeam).toBe("BLUE");
  });

  it("opponent agent cannot guess on the active team's turn", () => {
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    expect(e.revealCard("b1", "card_0").ok).toBe(false);
  });
});

describe("SpyWordsEngine — turnNonce & timer", () => {
  it("turnNonce bumps on turn change", () => {
    const e = makeEngine();
    const before = e.state.turnNonce;
    startWithForcedGrid(e, "RED");
    e.revealCard("r1", "card_17"); // neutral → end turn
    expect(e.state.turnNonce).toBeGreaterThan(before);
  });

  it("timer ends the active turn on timeout", () => {
    const e = makeEngine();
    e.setConfig({ timer: 60, customWords: [] });
    startWithForcedGrid(e, "RED");
    // Force deadline into the past.
    e.state.turnDeadline = Date.now() - 1;
    expect(e.tickTimer(Date.now())).toBe(true);
    expect(e.state.activeTeam).toBe("BLUE");
  });
});

describe("SpyWordsEngine — sanitize", () => {
  it("mask unrevealed cards for agents, reveal key for masterminds", async () => {
    const { sanitizeForPlayer, sanitizeForSpectator } = await import("../../network/sanitizer");
    const e = makeEngine();
    startWithForcedGrid(e, "RED");
    const state: GameState = e.state;
    const agentView = sanitizeForPlayer(state, "r1");
    expect(agentView.cards.filter((c) => c.isMasked).length).toBe(GRID_SIZE);
    const masterView = sanitizeForPlayer(state, "h");
    expect(masterView.cards.every((c) => !c.isMasked)).toBe(true);
    const specView = sanitizeForSpectator(state);
    expect(specView.cards.filter((c) => c.isMasked).length).toBe(GRID_SIZE);
  });
});