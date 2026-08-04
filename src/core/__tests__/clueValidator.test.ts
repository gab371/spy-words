import { describe, expect, it } from "vitest";
import { isValidClue, maxGuessesForClue, normalizeWord } from "../clueValidator";
import type { CodenamesCard } from "../types";

function card(word: string, revealed = false): CodenamesCard {
  return { id: `c_${word}`, word, color: "NEUTRAL", revealed };
}

describe("clueValidator", () => {
  it("normalizes accents and case", () => {
    expect(normalizeWord(" Éléphant ")).toBe("ELEPHANT");
  });

  it("rejects empty clue", () => {
    expect(isValidClue("", [card("Foret")]).valid).toBe(false);
    expect(isValidClue("   ", [card("Foret")]).valid).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidClue("deux mots", [card("Foret")]).valid).toBe(false);
  });

  it("rejects hyphens unless allowed", () => {
    expect(isValidClue("cerf-volant", [card("Foret")]).valid).toBe(false);
    expect(isValidClue("cerf-volant", [card("Foret")], true).valid).toBe(true);
  });

  it("rejects exact unrevealed grid word", () => {
    const r = isValidClue("Foret", [card("Foret")]);
    expect(r.valid).toBe(false);
  });

  it("allows a revealed grid word as clue", () => {
    const r = isValidClue("Foret", [card("Foret", true)]);
    expect(r.valid).toBe(true);
  });

  it("rejects clue containing an unrevealed grid word", () => {
    const r = isValidClue("ForetNoir", [card("Foret")]);
    expect(r.valid).toBe(false);
  });

  it("rejects clue that is a substring of an unrevealed grid word", () => {
    const r = isValidClue("Arc", [card("Arcier")]);
    expect(r.valid).toBe(false);
  });

  it("accepts an unrelated single word", () => {
    expect(isValidClue("Voyage", [card("Foret"), card("Ours")]).valid).toBe(true);
  });

  it("maxGuessesForClue is count+1", () => {
    expect(maxGuessesForClue(0)).toBe(1);
    expect(maxGuessesForClue(3)).toBe(4);
    expect(maxGuessesForClue(-2)).toBe(1);
  });
});