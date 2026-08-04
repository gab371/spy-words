import { test, expect } from "@playwright/test";
import {
  act,
  createEngine,
  forceGrid,
  getState,
  makeCards,
  setPlayerTeamRole,
  STANDARD_COLORS,
} from "./helpers/engine";
import type { CardColor } from "../src/core/types";

/**
 * Spy Words (Codenames) — per-rule E2E specs. The engine is driven directly via
 * window.__testHooks__ (no PeerJS, no 2nd browser context) for fast, deterministic
 * coverage. Each test sets up a 4-player game (1 Mastermind + 1 Agent per team),
 * forces the grid, and asserts the rule's observable effect on engine state.
 */

async function lobbyVisible(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Créer une Table/i })).toBeVisible({ timeout: 30_000 });
}

/** Build a 4-player game: RED Mastermind h / RED Agent r1 / BLUE Mastermind b / BLUE Agent b1. */
async function setupFourPlayers(page: import("@playwright/test").Page) {
  await createEngine(page);
  await act(page, "addPlayer", "h", "Hôte", "🕵️", true);
  await act(page, "addPlayer", "r1", "Rouge", "🔴", false);
  await act(page, "addPlayer", "b", "Bleu", "🔵", false);
  await act(page, "addPlayer", "b1", "Bleu1", "🔷", false);
  await setPlayerTeamRole(page, "h", "RED", "MASTERMIND");
  await setPlayerTeamRole(page, "r1", "RED", "AGENT");
  await setPlayerTeamRole(page, "b", "BLUE", "MASTERMIND");
  await setPlayerTeamRole(page, "b1", "BLUE", "AGENT");
}

/** Start the game with a forced grid (RED starts). startGame generates a random
 * grid first (needs valid masterminds), then we override with the forced grid. */
async function startWithGrid(page: import("@playwright/test").Page) {
  await setupFourPlayers(page);
  expect(await act(page, "startGame")).toBe(true);
  // Override the random grid with a deterministic layout AFTER startGame.
  await forceGrid(page, makeCards(STANDARD_COLORS), "RED");
  await setPlayerTeamRole(page, "h", "RED", "MASTERMIND");
  await setPlayerTeamRole(page, "r1", "RED", "AGENT");
  await setPlayerTeamRole(page, "b", "BLUE", "MASTERMIND");
  await setPlayerTeamRole(page, "b1", "BLUE", "AGENT");
  await act(page, "setPhase", "GIVING_CLUE");
  const state = await getState(page);
  expect(state.phase).toBe("GIVING_CLUE");
  expect(state.activeTeam).toBe("RED");
  expect(state.redRemaining).toBe(9);
  expect(state.blueRemaining).toBe(8);
}

test("LOBBY: refuses to start with fewer than 4 players", async ({ page }) => {
  await lobbyVisible(page);
  await createEngine(page);
  await act(page, "addPlayer", "h", "Hôte", "🕵️", true);
  await act(page, "addPlayer", "r1", "Rouge", "🔴", false);
  await setPlayerTeamRole(page, "h", "RED", "MASTERMIND");
  await setPlayerTeamRole(page, "r1", "RED", "AGENT");
  expect(await act(page, "startGame")).toBe(false);
});

test("GIVING_CLUE: only the active team mastermind can submit a valid clue", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  // Wrong-team mastermind rejected.
  expect((await act(page, "submitClue", "b", "Ocean", 1)).ok).toBe(false);
  // Agent rejected.
  expect((await act(page, "submitClue", "r1", "Ocean", 1)).ok).toBe(false);
  // Valid clue accepted.
  expect((await act(page, "submitClue", "h", "Ocean", 1)).ok).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("GUESSING");
  expect(state.currentClue.word).toBe("Ocean");
  expect(state.currentClue.count).toBe(1);
});

test("GIVING_CLUE: rejects clue that is an unrevealed grid word", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  // MOT0 is an unrevealed grid word.
  expect((await act(page, "submitClue", "h", "MOT0", 1)).ok).toBe(false);
  expect((await act(page, "submitClue", "h", "mot0", 1)).ok).toBe(false);
});

test("GUESSING: correct RED card keeps guessing and decrements redRemaining", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 2);
  // card_0 is RED.
  expect((await act(page, "revealCard", "r1", "card_0")).ok).toBe(true);
  const state = await getState(page);
  expect(state.redRemaining).toBe(8);
  expect(state.phase).toBe("GUESSING");
  expect(state.guessesMade).toBe(1);
});

test("GUESSING: neutral card ends the turn", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 2);
  // card_17 is NEUTRAL (index 9+8 = 17 → first NEUTRAL).
  expect((await act(page, "revealCard", "r1", "card_17")).ok).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("GIVING_CLUE");
  expect(state.activeTeam).toBe("BLUE");
});

test("GUESSING: opponent (BLUE) card ends the turn and gives a free reveal to BLUE", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 2);
  // card_9 is BLUE (indices 9..16).
  expect((await act(page, "revealCard", "r1", "card_9")).ok).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("GIVING_CLUE");
  expect(state.activeTeam).toBe("BLUE");
  expect(state.blueRemaining).toBe(7);
});

test("GUESSING: mastermind cannot guess", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 1);
  expect((await act(page, "revealCard", "h", "card_0")).ok).toBe(false);
});

test("GUESSING: opponent agent cannot guess on the active team's turn", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 1);
  expect((await act(page, "revealCard", "b1", "card_0")).ok).toBe(false);
});

test("GUESSING: quota = count+1 then auto-pass", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 1); // quota = 2
  expect((await act(page, "revealCard", "r1", "card_0")).ok).toBe(true);
  expect((await act(page, "revealCard", "r1", "card_1")).ok).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("GIVING_CLUE");
  expect(state.activeTeam).toBe("BLUE");
});

test("PASS: requires at least one guess before passing", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 2);
  expect((await act(page, "passTurn", "r1")).ok).toBe(false);
  expect((await act(page, "revealCard", "r1", "card_0")).ok).toBe(true);
  expect((await act(page, "passTurn", "r1")).ok).toBe(true);
  const state = await getState(page);
  expect(state.activeTeam).toBe("BLUE");
});

test("ASSASSIN: revealing the assassin ends the game and the other team wins", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  await act(page, "submitClue", "h", "Ocean", 1);
  expect((await act(page, "revealCard", "r1", "card_24")).ok).toBe(true); // ASSASSIN
  const state = await getState(page);
  expect(state.phase).toBe("GAME_OVER");
  expect(state.winnerTeam).toBe("BLUE");
  expect(state.lossCause).toBe("ASSASSIN");
});

test("VICTORY: exhausting a team's cards wins the game", async ({ page }) => {
  await lobbyVisible(page);
  await setupFourPlayers(page);
  expect(await act(page, "startGame")).toBe(true);
  // Build a forced grid with only 1 RED card remaining (so the first RED reveal wins).
  const colors: CardColor[] = [
    "RED",
    ...Array(8).fill("BLUE"),
    ...Array(15).fill("NEUTRAL"),
    "ASSASSIN",
  ];
  await forceGrid(page, makeCards(colors), "RED");
  await setPlayerTeamRole(page, "h", "RED", "MASTERMIND");
  await setPlayerTeamRole(page, "r1", "RED", "AGENT");
  await setPlayerTeamRole(page, "b", "BLUE", "MASTERMIND");
  await setPlayerTeamRole(page, "b1", "BLUE", "AGENT");
  await act(page, "setPhase", "GIVING_CLUE");
  await act(page, "submitClue", "h", "Ocean", 1);
  expect((await act(page, "revealCard", "r1", "card_0")).ok).toBe(true); // last RED
  const state = await getState(page);
  expect(state.phase).toBe("GAME_OVER");
  expect(state.winnerTeam).toBe("RED");
  expect(state.lossCause).toBe(null);
});

test("TURN_FLOW: full 2v2 turn alternation RED → BLUE → RED", async ({ page }) => {
  await lobbyVisible(page);
  await startWithGrid(page);
  // RED plays a neutral card → BLUE turn.
  await act(page, "submitClue", "h", "Ocean", 2);
  await act(page, "revealCard", "r1", "card_17");
  expect((await getState(page)).activeTeam).toBe("BLUE");
  // BLUE plays a neutral card → RED turn.
  await act(page, "submitClue", "b", "Mer", 2);
  await act(page, "revealCard", "b1", "card_18");
  expect((await getState(page)).activeTeam).toBe("RED");
});