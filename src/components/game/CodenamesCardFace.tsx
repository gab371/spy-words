import type { CSSProperties } from "react";
import type { CardColor, CodenamesCard } from "../../core/types";
import { PALETTE } from "../../core/theme";

interface CodenamesCardFaceProps {
  card: CodenamesCard;
  /** True when the viewer is a Mastermind (sees secret key on cover). */
  revealSecret?: boolean;
  /** Whether the Agents of the active team can click this card to guess. */
  canGuess?: boolean;
  /** Reveal animation key (bump to retrigger flip). */
  revealKey?: number;
  /** Validate / reveal on left click (Agents of the active team only). */
  onClick?: () => void;
  /** Toggle the local doubt mark on right-click (Agents only). */
  onToggleDoubt?: () => void;
  className?: string;
}

/**
 * Codenames word tile with a 3D flip reveal.
 * Unrevealed face = neutral parchment (Agents) or secret-key color (Mastermind).
 * Revealed face = the card's real color with the word embossed.
 *
 * Right-click toggles a local 🤔 doubt mark (never sent to peers) — like the
 * official online Codenames "mark" feature. Left-click validates the guess.
 */
export function CodenamesCardFace({
  card,
  revealSecret = false,
  canGuess = false,
  revealKey = 0,
  onClick,
  onToggleDoubt,
  className = "",
}: CodenamesCardFaceProps) {
  const revealed = card.revealed;
  const coverColor: CardColor = revealSecret && !revealed ? card.color : "NEUTRAL";
  const cover = PALETTE[coverColor];
  const face = PALETTE[revealed ? card.color : coverColor];
  const showDoubt = !revealed && !!card.doubtMark;

  // Dynamic font sizing class for long single words
  const len = card.word.length;
  const sizeClass =
    len > 11
      ? "text-[0.62rem] sm:text-[0.8rem]"
      : len > 8
      ? "text-[0.7rem] sm:text-[0.92rem]"
      : "";

  return (
    <button
      type="button"
      disabled={!canGuess || revealed}
      onClick={onClick}
      onContextMenu={(e) => {
        if (!onToggleDoubt || revealed) return;
        e.preventDefault();
        onToggleDoubt();
      }}
      aria-label={`${card.word}${revealed ? `, ${PALETTE[card.color].label}` : ""}${showDoubt ? ", marqué comme doute" : ""}`}
      data-p2play-card={card.id}
      data-revealed={revealed ? "true" : "false"}
      data-doubt={showDoubt ? "true" : "false"}
      className={`codenames-card ${className} ${
        canGuess && !revealed ? "codenames-card-guessable" : ""
      } ${showDoubt ? "codenames-card-doubt" : ""}`}
      style={{ "--reveal-key": revealKey } as CSSProperties}
    >
      <div className={`codenames-card-inner ${revealed ? "is-flipped" : ""}`}>
        {/* Cover face */}
        <div
          className="codenames-card-face codenames-card-cover"
          style={{
            background: `linear-gradient(135deg, ${cover.light}, ${cover.main} 60%, ${cover.dark})`,
            color: cover.ink,
          }}
        >
          <span className={`codenames-card-word font-sans ${sizeClass}`}>{card.word}</span>
          {revealSecret && !revealed && (
            <span className="codenames-card-secret">{cover.label.slice(0, 1)}</span>
          )}
          {showDoubt && <span className="codenames-card-doubt-badge">🤔</span>}
        </div>

        {/* Revealed face */}
        <div
          className="codenames-card-face codenames-card-revealed"
          style={{
            background: `linear-gradient(135deg, ${face.light}, ${face.main} 55%, ${face.dark})`,
            color: face.ink,
          }}
        >
          <span className={`codenames-card-word font-sans ${sizeClass}`}>{card.word}</span>
          <span className="codenames-card-tag">{face.label}</span>
        </div>
      </div>
    </button>
  );
}