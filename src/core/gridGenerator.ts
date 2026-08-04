import type { CardColor, CodenamesCard, GridSetup, TeamColor } from "./types";
import { GRID_SIZE } from "./types";

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(array: readonly T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the 25-card grid + secret key (9 / 8 / 7 / 1).
 *
 * - Starting team: 9 cards
 * - Second team:  8 cards
 * - Neutral:      7 cards
 * - Assassin:     1 card
 */
export function generateCodenamesGrid(
  dictionary: readonly string[],
  forcedWords?: readonly string[],
): GridSetup {
  const pool = dedupeDictionary(dictionary, forcedWords);
  if (pool.length < GRID_SIZE) {
    throw new Error("Le dictionnaire doit contenir au moins 25 mots uniques.");
  }

  const selectedWords = shuffle(pool).slice(0, GRID_SIZE);
  const startingTeam: TeamColor = Math.random() < 0.5 ? "RED" : "BLUE";
  const secondTeam: TeamColor = startingTeam === "RED" ? "BLUE" : "RED";

  const colors: CardColor[] = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(secondTeam),
    ...Array(7).fill("NEUTRAL" as CardColor),
    "ASSASSIN" as CardColor,
  ];
  const shuffledColors = shuffle(colors);

  const cards: CodenamesCard[] = selectedWords.map((word, index) => ({
    id: `card_${index}_${word.toLowerCase()}`,
    word,
    color: shuffledColors[index],
    revealed: false,
  }));

  const redRemaining = cards.filter((c) => c.color === "RED").length;
  const blueRemaining = cards.filter((c) => c.color === "BLUE").length;

  return { startingTeam, cards, redRemaining, blueRemaining };
}

/** Merge custom words first (priority), then default dictionary, de-duped. */
export function buildDictionary(
  base: readonly string[],
  custom?: readonly string[],
): string[] {
  return dedupeDictionary(base, custom);
}

function dedupeDictionary(
  base: readonly string[],
  custom?: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const norm = (w: string) =>
    w
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  for (const w of [...(custom ?? []), ...base]) {
    const trimmed = w.trim();
    if (!trimmed) continue;
    const key = norm(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}