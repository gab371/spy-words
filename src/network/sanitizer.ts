import type { CodenamesCard, GameState, Player } from "../core/types";

/** Replace a card's real color with NEUTRAL-masked for non-Mastermind viewers. */
function maskCard(card: CodenamesCard): CodenamesCard {
  if (card.revealed) return { ...card };
  return { ...card, color: "NEUTRAL", isMasked: true };
}

/**
 * Per-viewer sanitization:
 * - Masterminds see the full secret key.
 * - Agents (and spectators) see unrevealed cards masked as NEUTRAL.
 * - Cards already revealed always keep their true color.
 */
export function sanitizeForPlayer(state: GameState, playerId: string): GameState {
  const viewer = state.players.find((p) => p.id === playerId);
  const isMastermind = !!viewer && viewer.role === "MASTERMIND";
  return withMaskedCards(state, isMastermind);
}

export function sanitizeForSpectator(state: GameState): GameState {
  return withMaskedCards(state, false);
}

function withMaskedCards(state: GameState, revealKey: boolean): GameState {
  const clone: GameState = structuredClone(state);
  clone.cards = clone.cards.map((c) => (revealKey ? { ...c } : maskCard(c)));
  // Players' internal role/team are public (needed for UI), keep them.
  clone.players = clone.players.map((p): Player => ({ ...p }));
  return clone;
}