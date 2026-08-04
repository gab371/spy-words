import { useMemo, useState } from "react";
import { Input } from "p2play-core/ui";
import { isValidClue, maxGuessesForClue } from "../../core/clueValidator";
import type { GameState } from "../../core/types";

interface ClueInputPanelProps {
  gameState: GameState;
  onSubmit: (clueWord: string, count: number) => void;
  disabled?: boolean;
}

/** Mastermind clue form: word + number, live `isValidClue` validation. */
export function ClueInputPanel({
  gameState,
  onSubmit,
  disabled,
}: ClueInputPanelProps) {
  const [word, setWord] = useState("");
  const [count, setCount] = useState(1);

  const validation = useMemo(
    () => isValidClue(word, gameState.cards),
    [word, gameState.cards],
  );

  const canSubmit =
    !disabled && validation.valid && word.trim().length > 0 && count >= 0 && count <= 9;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(word.trim(), count);
    setWord("");
    setCount(1);
  };

  return (
    <div className="clue-input-panel">
      <h3 className="clue-title">Donnez votre indice</h3>
      <p className="clue-hint">
        Un mot + un nombre. Les Agents pourront deviner jusqu'à{" "}
        <strong>{maxGuessesForClue(count)}</strong> cartes.
      </p>
      <div className="clue-row">
        <Input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Mot indice…"
          maxLength={24}
          disabled={disabled}
          className="clue-word-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Input
          type="number"
          min={0}
          max={9}
          value={count}
          onChange={(e) => setCount(Number(e.target.value) || 0)}
          disabled={disabled}
          className="clue-count-input"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="clue-submit"
        >
          Transmettre
        </button>
      </div>
      {!validation.valid && word.trim().length > 0 && (
        <p className="clue-error" role="alert">
          {validation.reason}
        </p>
      )}
    </div>
  );
}