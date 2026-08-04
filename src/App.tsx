import { useState } from "react";
import type { PeerManagerLike } from "p2play-core";
import { RoomCodeBadge } from "p2play-core";
import { useGame } from "./hooks/useGame";
import { useBoardExpand } from "./hooks/useBoardExpand";
import { Lobby } from "./components/game/Lobby";
import { GameBoard } from "./components/game/GameBoard";
import { SpectatorView } from "./components/game/SpectatorView";
import { Search, FileText, X } from "lucide-react";
import { SoundToggle } from "p2play-core/ui";
import { VoiceChatPanel } from "p2play-core/voice";
import { soundManager } from "./core/soundFX";
import "./styles/arena.css";

declare const __APP_VERSION__: string;

interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: unknown;
  hubPhase?: string;
  onExit?: () => void;
}

export default function App({
  isEmbedded = false,
  externalPeerManager,
  playerName,
  playerAvatar,
  isHost,
  lateJoin,
  gameConfig,
  hubPhase,
  onExit,
}: AppProps) {
  const game = useGame({
    externalPeerManager,
    isEmbedded,
    playerName,
    playerAvatar,
    isHost,
    lateJoin,
    gameConfig,
    hubPhase,
  });
  const [showRules, setShowRules] = useState(false);

  const showLobby = !game.gameState || game.gameState.phase === "LOBBY";
  const localIsSpectator = !!game.gameState?.spectators.some(
    (s) => s.id === game.myPeerId,
  );
  const { expanded: boardExpanded, toggle: toggleExpand } = useBoardExpand(
    showLobby || localIsSpectator,
  );

  const me = game.gameState?.players.find((p) => p.id === game.myPeerId);
  const exitFn = isEmbedded && onExit ? onExit : game.disconnect;

  return (
    <div
      className={
        boardExpanded
          ? "h-screen overflow-hidden text-zinc-50 font-sans flex flex-col relative"
          : "min-h-screen text-zinc-50 font-sans flex flex-col justify-between relative"
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />

      {!boardExpanded && (
        <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-6 px-4 border-b border-zinc-800/60 relative z-10">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight whitespace-nowrap shrink-0">
                SPY WORDS
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-amber-500/60 font-semibold block leading-none mt-0.5">
                L'art de l'indice et de la déduction
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-full border border-zinc-800 font-bold transition-all"
              title="Règles du jeu"
            >
              <FileText className="w-4 h-4" />
              <span>Règles</span>
            </button>

            <SoundToggle
              soundManager={soundManager}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
            />

            {game.gameState && game.gameState.phase !== "LOBBY" && (
              <div className="flex items-center gap-2 border-l border-zinc-800/60 pl-3">
                {game.hostPeerId && (
                  <RoomCodeBadge
                    code={game.hostPeerId}
                    accentClassName="text-amber-300"
                    className="border-zinc-700/60 bg-zinc-900 text-zinc-200/80"
                  />
                )}
                <button
                  onClick={isEmbedded && onExit && game.isHost ? onExit : game.disconnect}
                  className="text-xs px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 border border-rose-900/30 rounded-xl transition-all font-bold"
                  title={isEmbedded ? (game.isHost ? "Retour au Hub" : "Quitter le Hub (la partie continue)") : "Quitter"}
                >
                  {isEmbedded ? (game.isHost ? "← Hub" : "Quitter") : "Quitter"}
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <main
        className={
          boardExpanded
            ? "fixed inset-0 z-40 overflow-auto px-4 py-4 bg-[radial-gradient(circle_at_center,#0a0f1a_0%,#09090b_100%)]"
            : "flex-1 w-full max-w-7xl mx-auto px-4 py-8 relative z-10"
        }
      >
        {showLobby ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Lobby
              myPeerId={game.myPeerId}
              hostPeerId={game.hostPeerId}
              isHost={game.isHost}
              players={game.gameState?.players ?? []}
              spectators={game.gameState?.spectators ?? []}
              spectatorLocks={game.gameState?.spectatorLocks ?? {}}
              status={game.status}
              error={game.error}
              config={game.gameState?.config}
              isEmbedded={isEmbedded}
              hostRoom={game.hostRoom}
              joinRoom={game.joinRoom}
              toggleReady={game.toggleReady}
              startGame={game.startGame}
              disconnect={exitFn}
              onSetRole={game.setRole}
              onLockSpectator={game.lockSpectator}
              onSetTeamRole={game.setTeamRole}
              onChangeConfig={game.changeConfig}
            />
          </div>
        ) : localIsSpectator ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <SpectatorView gameState={game.gameState!} onDisconnect={exitFn} />
          </div>
        ) : (
          <GameBoard
            gameState={game.gameState!}
            localPlayerId={game.myPeerId ?? ""}
            me={me}
            isHost={game.isHost}
            chatMessages={game.chatMessages}
            onSubmitClue={game.submitClue}
            onReveal={game.revealCard}
            onPass={game.passTurn}
            onNextRound={game.resetLobby}
            onSendChat={game.sendChatMessage}
            onDisconnect={exitFn}
            boardExpanded={boardExpanded}
            onToggleExpand={toggleExpand}
          />
        )}
      </main>

      {!boardExpanded && (
        <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-zinc-600 py-6 px-4 border-t border-zinc-800/40 flex justify-between items-center">
          <div>Spy Words - Réseau Privé Peer-to-Peer - Version v{__APP_VERSION__}</div>
          <a
            href="https://github.com/gab371/spy-words"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>Dépôt GitHub</span>
          </a>
        </footer>
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {!isEmbedded && game.peerManager && game.status === "CONNECTED" && game.gameState && (
        <div className="fixed top-24 left-4 z-[200]">
          <VoiceChatPanel
            peerManager={game.peerManager}
            username={game.localPlayerName || playerName}
            avatar={game.localPlayerAvatar || playerAvatar}
            title="Voice Chat Spy"
          />
        </div>
      )}
    </div>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md transition-all">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl text-zinc-100 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
          🕵️ Règles : Spy Words
        </h2>

        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs mb-1">
              Objectif
            </h3>
            <p>
              Deux équipes (Rouge et Bleue) s'affrontent sur une grille de 25 mots. Chaque
              équipe possède un <strong>Mastermind</strong> qui connaît la clé secrète
              (la couleur cachée de chaque mot) et des <strong>Agents</strong> qui devinent.
              La première équipe à révéler tous ses mots gagne — mais attention à l'Assassin !
            </p>
          </section>

          <section>
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs mb-1">
              La grille & la clé secrète
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li><strong className="text-red-400">9 cartes Rouges</strong> pour l'équipe qui commence.</li>
              <li><strong className="text-blue-400">8 cartes Bleues</strong> pour l'équipe qui seconde.</li>
              <li><strong>7 cartes Neutres</strong> (témoins innocents).</li>
              <li><strong className="text-zinc-200">1 carte Assassin</strong> — la révéler fait perdre immédiatement !</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs mb-1">
              Tour de jeu
            </h3>
            <ol className="list-decimal list-inside pl-2 space-y-1.5">
              <li>Le <strong>Mastermind</strong> de l'équipe active donne un indice : un seul mot + un nombre.</li>
              <li>Les <strong>Agents</strong> de l'équipe discutent et cliquent sur des mots. Ils ont droit à <strong>nombre + 1</strong> devinettes.</li>
              <li>S'ils tombent sur un mot de leur couleur : ils peuvent continuer.</li>
              <li>S'ils tombent sur un mot neutre ou adverse : le tour passe à l'autre équipe.</li>
              <li>Ils peuvent <strong>Passer la main</strong> après au moins une devinette.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs mb-1">
              Victoire & Défaite
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Révéler l'<strong>Assassin</strong> fait gagner l'équipe adverse immédiatement.</li>
              <li>Trouver tous ses mots de couleur fait gagner la partie.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs mb-1">
              Règles des indices
            </h3>
            <p>
              L'indice doit être un mot unique, différent des mots non révélés sur la grille (ni
              identique, ni sous-mot/dérivé). Les mots déjà révélés peuvent être réutilisés.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}