import type { CodenamesCard } from "./types";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/** Normalize a word: trim, uppercase, strip accents. */
export function normalizeWord(word: string): string {
  return word
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Validate a clue proposed by a Mastermind.
 *
 * Rules:
 * 1. Non-empty single word (no spaces). Hyphens allowed only if `allowHyphenated`.
 * 2. Not an unrevealed grid word (exact match).
 * 3. Not a substring / superstring of an unrevealed grid word (e.g. "ARC" if
 *    "ARCIER" is unrevealed). Revealed grid words may be reused as clues.
 */
export function isValidClue(
  rawClue: string,
  gridCards: readonly CodenamesCard[],
  allowHyphenated = false,
): ValidationResult {
  const clue = normalizeWord(rawClue);

  if (!clue || clue.length === 0) {
    return { valid: false, reason: "L'indice ne peut pas être vide." };
  }

  if (clue.includes(" ")) {
    return {
      valid: false,
      reason: "L'indice doit être composé d'un seul mot (pas d'espaces).",
    };
  }
  if (!allowHyphenated && clue.includes("-")) {
    return {
      valid: false,
      reason: "Les tirets ne sont pas autorisés dans les indices.",
    };
  }
  if (clue.length > 24) {
    return { valid: false, reason: "L'indice est trop long (max 24 caractères)." };
  }

  const unrevealed = gridCards
    .filter((c) => !c.revealed)
    .map((c) => normalizeWord(c.word));

  for (const gridWord of unrevealed) {
    if (clue === gridWord) {
      return {
        valid: false,
        reason: `L'indice "${rawClue.trim()}" est un mot présent non révélé sur la grille.`,
      };
    }
    if (clue.includes(gridWord)) {
      return {
        valid: false,
        reason: `L'indice "${rawClue.trim()}" contient le mot non révélé "${gridWord}".`,
      };
    }
    if (gridWord.includes(clue)) {
      return {
        valid: false,
        reason: `L'indice "${rawClue.trim()}" est une partie du mot non révélé "${gridWord}".`,
      };
    }
  }

  return { valid: true };
}

/** Max guesses for a clue = count + 1. */
export function maxGuessesForClue(count: number): number {
  return Math.max(0, count) + 1;
}