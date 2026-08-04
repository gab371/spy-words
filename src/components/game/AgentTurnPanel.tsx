import type { GameState } from "../../core/types";
import { maxGuessesForClue } from "../../core/clueValidator";

interface AgentTurnPanelProps {
  gameState: GameState;
  onPass: () => void;
  canGuess: boolean;
  hasGuessed: boolean;
}

/** Agents' action panel: clue banner, quota Fait X / Max N+1, Pass button. */
export function AgentTurnPanel({
  gameState,
  onPass,
  canGuess,
  hasGuessed,
}: AgentTurnPanelProps) {
  const clue = gameState.currentClue;
  const max = clue ? maxGuessesForClue(clue.count) : 0;

  return (
    <div className="agent-turn-panel">
      {clue ? (
        <div className="clue-banner">
          <span className="clue-banner-word">« {clue.word} »</span>
          <span className="clue-banner-count">{clue.count}</span>
        </div>
      ) : (
        <div className="clue-banner clue-banner-pending">
          En attente de l'indice du Mastermind…
        </div>
      )}

      <div className="agent-quota">
        <span>
          Devinettes : <strong>{gameState.guessesMade}</strong> / {max}
        </span>
      </div>

      <button
        type="button"
        onClick={onPass}
        disabled={!canGuess || !hasGuessed}
        className="agent-pass"
        title={
          hasGuessed
            ? "Passer la main à l'autre équipe"
            : "Faites au moins une devinette"
        }
      >
        Passer la main
      </button>
    </div>
  );
}