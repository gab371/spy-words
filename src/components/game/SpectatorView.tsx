import React from "react";
import type { GameState } from "../../core/types";
import { CodenamesBoard } from "./CodenamesBoard";

interface SpectatorViewProps {
  gameState: GameState;
  onDisconnect?: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  LOBBY: "Salon",
  GIVING_CLUE: "Indice en cours",
  GUESSING: "Devinettes",
  GAME_OVER: "Partie Terminée",
};

export const SpectatorView: React.FC<SpectatorViewProps> = ({ gameState, onDisconnect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👁</span>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">
              Mode Spectateur
            </h1>
            <p className="text-xs text-zinc-400">Vous observez la partie sans participer.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-xs font-bold">
          {PHASE_LABELS[gameState.phase] || gameState.phase}
        </span>
      </div>

      <div className="team-scoreboard mb-4">
        <span className="team-pill team-pill-red">🔴 Rouge — {gameState.redRemaining}</span>
        <span className="team-pill team-pill-blue">🔵 Bleu — {gameState.blueRemaining}</span>
      </div>

      <CodenamesBoard
        gameState={gameState}
        myPeerId={null}
        viewerIsMastermind={false}
        canGuess={false}
        onReveal={() => {}}
      />

      <div className="mt-6 bg-zinc-950/40 border border-zinc-700/60 rounded-2xl p-3 max-h-48 overflow-y-auto">
        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
          Journal de la partie
        </div>
        <div className="space-y-1">
          {gameState.logs.slice(0, 12).map((l) => (
            <div key={l.id} className="text-[11px] text-zinc-300">
              <span className="text-zinc-500 font-mono mr-2">{l.timestamp}</span>
              {l.message}
            </div>
          ))}
          {gameState.logs.length === 0 && (
            <div className="text-[11px] text-zinc-500">Aucun événement.</div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onDisconnect}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-all"
        >
          Quitter le salon
        </button>
      </div>
    </div>
  );
};