import type { Page } from "@playwright/test";
import type { CardColor, CodenamesCard, TeamColor } from "../../src/core/types";

/**
 * Playwright helpers wrapping window.__testHooks__ for Spy Words E2E tests.
 * The engine is driven directly (no PeerJS, no 2nd browser context) for fast,
 * deterministic per-rule coverage. See docs/plans/26_codenames/plan.md.
 */

/** Create a fresh standalone engine and return its initial state. */
export async function createEngine(page: Page): Promise<unknown> {
  return page.evaluate(() => (window as any).__testHooks__.createEngine());
}

/** Call an engine method by name with args; returns its (serialized) result. */
export async function act(page: Page, method: string, ...args: unknown[]): Promise<unknown> {
  return page.evaluate(
    ({ method, args }) => (window as any).__testHooks__.act(method, args),
    { method, args },
  );
}

/** Force the 25-card grid with a known color layout. */
export async function forceGrid(
  page: Page,
  cards: CodenamesCard[],
  startingTeam: TeamColor,
): Promise<void> {
  await page.evaluate(
    ({ cards, startingTeam }) =>
      (window as any).__testHooks__.forceGrid(cards, startingTeam),
    { cards, startingTeam },
  );
}

/** Force a player's team and role. */
export async function setPlayerTeamRole(
  page: Page,
  playerId: string,
  team: TeamColor,
  role: "MASTERMIND" | "AGENT",
): Promise<void> {
  await page.evaluate(
    ({ playerId, team, role }) =>
      (window as any).__testHooks__.setPlayerTeamRole(playerId, team, role),
    { playerId, team, role },
  );
}

/** Force the engine phase. */
export async function setPhase(page: Page, phase: string): Promise<void> {
  await page.evaluate((p) => (window as any).__testHooks__.setPhase(p), phase);
}

/** Read the live engine state. */
export async function getState(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__testHooks__.getState());
}

/** Wait until a predicate over the live state returns true. */
export async function waitForState(
  page: Page,
  predicate: (state: any) => boolean,
  timeout = 10_000,
): Promise<void> {
  await expect.poll(async () => predicate(await getState(page)), { timeout }).toBe(true);
}

/** Build a deterministic 25-card grid with the given color layout. */
export function makeCards(colors: CardColor[]): CodenamesCard[] {
  return colors.map((color, i) => ({
    id: `card_${i}`,
    word: `MOT${i}`,
    color,
    revealed: false,
  }));
}

/** Canonical 9/8/7/1 layout (RED starts). */
export const STANDARD_COLORS: CardColor[] = [
  ...Array(9).fill("RED"),
  ...Array(8).fill("BLUE"),
  ...Array(7).fill("NEUTRAL"),
  "ASSASSIN",
] as CardColor[];

// Re-export expect for convenience in specs.
export { expect } from "@playwright/test";