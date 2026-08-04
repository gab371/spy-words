import type { GameState, Player } from "../../core/types";
import { GRID_COLUMNS, GRID_SIZE } from "../../core/types";
import { CodenamesCardFace } from "./CodenamesCardFace";

interface CodenamesBoardProps {
  gameState: GameState;
  myPeerId: string | null;
  /** Am I a Mastermind (reveal secret key) — Agents/spectators see masks. */
  viewerIsMastermind: boolean;
  /** Can I click to guess right now (Agent of the active team, GUESSING phase). */
  canGuess: boolean;
  onReveal: (cardId: string) => void;
  /** Toggle the local doubt mark on right-click (Agents only). */
  onToggleDoubt?: (cardId: string) => void;
  className?: string;
}

/**
 * 5x5 responsive Codenames grid. The board is the visual anchor; cards flip
 * 3D on reveal. Responsive: square/rectangular tiles that fill the column width.
 */
export function CodenamesBoard({
  gameState,
  viewerIsMastermind,
  canGuess,
  onReveal,
  onToggleDoubt,
  className = "",
}: CodenamesBoardProps) {
  return (
    <div
      className={`codenames-board ${className}`}
      style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Grille de noms de code secrets"
    >
      {gameState.cards.slice(0, GRID_SIZE).map((card, index) => (
        <CodenamesCardFace
          key={card.id}
          card={card}
          revealSecret={viewerIsMastermind}
          canGuess={canGuess}
          revealKey={card.revealed ? 1 : 0}
          onClick={() => onReveal(card.id)}
          onToggleDoubt={onToggleDoubt ? () => onToggleDoubt(card.id) : undefined}
          className={`codenames-cell codenames-cell-${index}`}
        />
      ))}
    </div>
  );
}

/** Count remaining cards per team for the scoreboard. */
export function teamCounts(state: GameState): {
  red: number;
  blue: number;
} {
  return { red: state.redRemaining, blue: state.blueRemaining };
}

/** Whether the given player is an Agent of the active team. */
export function isGuessingAgent(
  state: GameState,
  player: Player | undefined,
): boolean {
  return !!player && player.role === "AGENT" && player.team === state.activeTeam;
}