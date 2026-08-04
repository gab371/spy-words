import React, { useMemo, useState } from "react";
import { JournalPanel } from "p2play-core/chat";
import type { ChatMessage } from "p2play-core";
import type { CodenamesCard, GameState, Player, TeamColor } from "../../core/types";
import { CodenamesBoard, isGuessingAgent } from "./CodenamesBoard";
import { ClueInputPanel } from "./ClueInputPanel";
import { AgentTurnPanel } from "./AgentTurnPanel";
import { ChatBox } from "./ChatBox";
import { ExpandToggle } from "./ExpandToggle";

interface GameBoardProps {
  gameState: GameState;
  localPlayerId: string;
  me: Player | undefined;
  isHost: boolean;
  chatMessages: ChatMessage[];
  onSubmitClue: (word: string, count: number) => void;
  onReveal: (cardId: string) => void;
  onPass: () => void;
  onNextRound: () => void;
  onSendChat: (text: string) => void;
  onDisconnect: () => void;
  boardExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  me,
  isHost,
  chatMessages,
  onSubmitClue,
  onReveal,
  onPass,
  onNextRound,
  onSendChat,
  boardExpanded = false,
  onToggleExpand,
}) => {
  const viewerIsMastermind = !!me && me.role === "MASTERMIND";
  const isActiveAgent = isGuessingAgent(gameState, me);
  const isActiveMastermind =
    !!me && me.role === "MASTERMIND" && me.team === gameState.activeTeam;
  const canMark = !!me && (me.role === "AGENT" || me.role === "MASTERMIND");

  // Local-only doubt marks (🤔). Never transmitted to peers — survives state
  // updates by keying on card.id, resets on a new game (LOBBY → grid regen).
  const [doubtMarks, setDoubtMarks] = useState<Set<string>>(new Set());
  const lastGridKey = React.useRef<string>("");
  const gridKey = gameState.cards.map((c) => c.id).join("|");
  if (lastGridKey.current !== gridKey) {
    lastGridKey.current = gridKey;
    if (doubtMarks.size > 0) setDoubtMarks(new Set());
  }

  const toggleDoubt = (cardId: string) => {
    setDoubtMarks((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  // Merge local doubt marks into the cards rendered by the board.
  const cardsWithDoubt = useMemo<CodenamesCard[]>(() => {
    if (doubtMarks.size === 0) return gameState.cards;
    return gameState.cards.map((c) =>
      doubtMarks.has(c.id) && !c.revealed ? { ...c, doubtMark: true } : c,
    );
  }, [gameState.cards, doubtMarks]);

  const boardState = { ...gameState, cards: cardsWithDoubt };

  const boardTeamClass =
    gameState.phase !== "GAME_OVER"
      ? gameState.activeTeam === "RED"
        ? "codenames-board-team-red"
        : "codenames-board-team-blue"
      : "";

  return (
    <div className="relative w-full space-y-4">
      <TeamScoreboard
        state={gameState}
        players={gameState.players}
        me={me}
        boardExpanded={boardExpanded}
        onToggleExpand={onToggleExpand}
      />

      <div
        className={`grid grid-cols-1 gap-6 ${
          boardExpanded ? "xl:grid-cols-5" : "lg:grid-cols-4"
        }`}
      >
        <div
          className={`space-y-4 ${boardExpanded ? "xl:col-span-4" : "lg:col-span-3"}`}
        >
          {gameState.phase === "GAME_OVER" ? (
            <GameOverBanner
              state={gameState}
              isHost={isHost}
              onNextRound={onNextRound}
            />
          ) : (
            <>
              <CodenamesBoard
                gameState={boardState}
                myPeerId={me?.id ?? null}
                viewerIsMastermind={viewerIsMastermind}
                canGuess={isActiveAgent && gameState.phase === "GUESSING"}
                onReveal={onReveal}
                onToggleDoubt={canMark ? toggleDoubt : undefined}
                className={boardTeamClass}
              />

              <div className="game-actions">
                {gameState.phase === "GIVING_CLUE" && isActiveMastermind && (
                  <ClueInputPanel gameState={gameState} onSubmit={onSubmitClue} />
                )}
                {gameState.phase === "GUESSING" && (
                  <AgentTurnPanel
                    gameState={gameState}
                    onPass={onPass}
                    canGuess={isActiveAgent}
                    hasGuessed={gameState.hasGuessed}
                  />
                )}
                {(gameState.phase === "GIVING_CLUE" || gameState.phase === "GUESSING") &&
                  !isActiveMastermind &&
                  !(isActiveAgent && gameState.phase === "GUESSING") && (
                    <p className="text-center text-zinc-400 text-sm py-2">
                      {gameState.phase === "GIVING_CLUE"
                        ? `En attente de l'indice du Mastermind ${gameState.activeTeam}…`
                        : "Les Agents réfléchissent…"}
                    </p>
                  )}
              </div>

              {canMark && (
                <p className="text-center text-[11px] text-zinc-500">
                  Clic gauche pour valider · Clic droit pour marquer un doute 🤔
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-[280px] flex flex-col">
            <JournalPanel
              entries={gameState.logs}
              title="Journal des Indices"
              emptyLabel="Aucun événement."
              className="flex flex-col h-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl p-3 overflow-hidden text-zinc-100 font-sans"
              scrollbarAccent="amber"
            />
          </div>
          <ChatBox
            messages={chatMessages}
            onSendMessage={onSendChat}
            disabled={gameState.enableTextChat === false}
          />
        </div>
      </div>
    </div>
  );
};

function TeamScoreboard({
  state,
  players,
  me,
  boardExpanded,
  onToggleExpand,
}: {
  state: GameState;
  players: Player[];
  me: Player | undefined;
  boardExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const redPlayers = players.filter((p) => p.team === "RED");
  const bluePlayers = players.filter((p) => p.team === "BLUE");

  return (
    <div className="team-scoreboard">
      <TeamColumn
        team="RED"
        players={redPlayers}
        remaining={state.redRemaining}
        active={state.activeTeam === "RED" && state.phase !== "GAME_OVER"}
        me={me}
      />
      <TeamColumn
        team="BLUE"
        players={bluePlayers}
        remaining={state.blueRemaining}
        active={state.activeTeam === "BLUE" && state.phase !== "GAME_OVER"}
        me={me}
      />
      {onToggleExpand && (
        <ExpandToggle
          expanded={boardExpanded ?? false}
          onToggle={onToggleExpand}
          className="relative top-0 right-0 w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/80 text-amber-300 hover:bg-zinc-700 hover:border-amber-500/70 transition-all cursor-pointer"
        />
      )}
    </div>
  );
}

function TeamColumn({
  team,
  players,
  remaining,
  active,
  me,
}: {
  team: TeamColor;
  players: Player[];
  remaining: number;
  active: boolean;
  me: Player | undefined;
}) {
  const isRed = team === "RED";
  return (
    <div className={`team-column ${isRed ? "team-column-red" : "team-column-blue"} ${active ? "team-column-active" : ""}`}>
      <div className="team-column-header">
        <span className="team-column-emoji">{isRed ? "🔴" : "🔵"}</span>
        <span className="team-column-name">{isRed ? "Rouge" : "Bleu"}</span>
        <span className="team-column-remaining">{remaining} restant</span>
      </div>
      <div className="team-column-players">
        {players.length === 0 && (
          <span className="team-column-empty">—</span>
        )}
        {players.map((p) => (
          <span
            key={p.id}
            className={`team-player ${p.id === me?.id ? "team-player-me" : ""} ${p.disconnected ? "team-player-disconnected" : ""}`}
            title={p.disconnected ? `${p.name} (déconnecté)` : p.name}
          >
            <span className="team-player-avatar">{p.avatar}</span>
            <span className="team-player-name">{p.name}</span>
            <span className="team-player-role">
              {p.role === "MASTERMIND" ? "🧠" : p.role === "AGENT" ? "🎯" : ""}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function GameOverBanner({
  state,
  isHost,
  onNextRound,
}: {
  state: GameState;
  isHost: boolean;
  onNextRound: () => void;
}) {
  const winner = state.winnerTeam;
  const byAssassin = state.lossCause === "ASSASSIN";
  return (
    <div className="game-over-banner">
      <div
        className={`game-over-title ${
          winner === "RED" ? "game-over-title-red" : "game-over-title-blue"
        }`}
      >
        Équipe {winner === "RED" ? "ROUGE" : "BLEUE"} victorieuse !
      </div>
      <p className="text-zinc-300 text-sm mb-4">
        {byAssassin
          ? "Victoire par révélation de l'Assassin."
          : "Tous les mots de l'équipe ont été trouvés."}
      </p>
      {isHost && (
        <button
          type="button"
          onClick={onNextRound}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 font-bold hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Recommencer une partie
        </button>
      )}
    </div>
  );
}