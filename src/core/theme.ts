import type { CardColor } from "../core/types";

/** Espionage palette: Crimson Red, Cobalt Blue, Sand Neutral, Black Assassin. */
export const PALETTE: Record<
  CardColor,
  { main: string; light: string; dark: string; ink: string; label: string }
> = {
  RED: {
    main: "#DC2626",
    light: "#F87171",
    dark: "#7F1D1D",
    ink: "#fff",
    label: "ROUGE",
  },
  BLUE: {
    main: "#2563EB",
    light: "#60A5FA",
    dark: "#1E3A8A",
    ink: "#fff",
    label: "BLEU",
  },
  NEUTRAL: {
    main: "#D6BD8A",
    light: "#EAD9B0",
    dark: "#9C8554",
    ink: "#1A1206",
    label: "NEUTRE",
  },
  ASSASSIN: {
    main: "#111827",
    light: "#374151",
    dark: "#030712",
    ink: "#FCD34D",
    label: "ASSASSIN",
  },
};

/** Cover (unrevealed) card colors for Mastermind secret-key view. */
export const COVER_PALETTE = {
  RED: PALETTE.RED.main,
  BLUE: PALETTE.BLUE.main,
  NEUTRAL: "#A8A29E",
  ASSASSIN: "#0B0B0B",
} as const;