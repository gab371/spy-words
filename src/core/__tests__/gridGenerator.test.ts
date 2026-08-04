import { describe, expect, it } from "vitest";
import {
  buildDictionary,
  generateCodenamesGrid,
  shuffle,
} from "../gridGenerator";
import { DEFAULT_DICTIONARY } from "../dictionary";
import { GRID_SIZE } from "../types";

describe("gridGenerator", () => {
  it("produces a 25-card grid with 9/8/7/1 distribution", () => {
    const dict = buildDictionary(DEFAULT_DICTIONARY);
    const grid = generateCodenamesGrid(dict);
    expect(grid.cards).toHaveLength(GRID_SIZE);
    expect(grid.cards.every((c) => !c.revealed)).toBe(true);
    expect(grid.cards.every((c) => c.id && c.word)).toBe(true);
    const counts = {
      RED: 0,
      BLUE: 0,
      NEUTRAL: 0,
      ASSASSIN: 0,
    } as Record<string, number>;
    for (const c of grid.cards) counts[c.color]++;
    expect(counts[grid.startingTeam]).toBe(9);
    expect(counts[grid.startingTeam === "RED" ? "BLUE" : "RED"]).toBe(8);
    expect(counts.NEUTRAL).toBe(7);
    expect(counts.ASSASSIN).toBe(1);
    const startingIsRed = grid.startingTeam === "RED";
    expect(grid.redRemaining).toBe(startingIsRed ? 9 : 8);
    expect(grid.blueRemaining).toBe(startingIsRed ? 8 : 9);
  });

  it("throws if the dictionary has fewer than 25 unique words", () => {
    expect(() => generateCodenamesGrid(["un", "deux", "trois"])).toThrow();
  });

  it("merges custom words first and dedupes", () => {
    const merged = buildDictionary(DEFAULT_DICTIONARY, [
      "Avalon",
      "AVALON",
      "  Avalon  ",
      "Espionnage",
    ]);
    expect(merged[0]).toBe("Avalon");
    expect(merged.filter((w) => w.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "AVALON"))
      .toHaveLength(1);
  });

  it("shuffle returns all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr);
  });
});