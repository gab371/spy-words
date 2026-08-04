import { useState } from "react";
import { CopyRoomLinkButton, P2PlayLobby } from "p2play-core";
import { Badge, Button } from "p2play-core/ui";
import type { GameConfig, Player, PlayerRole, Spectator, TeamColor, TimerMode } from "../../core/types";
import { SpectatorRolePanel } from "./SpectatorRolePanel";
import { TeamRolePanel } from "./TeamRolePanel";

interface LobbyProps {
  myPeerId: string | null;
  hostPeerId: string | null;
  isHost: boolean;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  status: string;
  error: string | null;
  config?: GameConfig;
  isEmbedded?: boolean;
  hostRoom: (name: string, avatar: string, enableVoice?: boolean, enableTextChat?: boolean) => Promise<void>;
  joinRoom: (name: string, avatar: string, roomId: string) => Promise<void>;
  toggleReady: (ready: boolean) => void;
  startGame: () => void;
  disconnect: () => void;
  onSetRole: (peerId: string, role: PlayerRole) => void;
  onLockSpectator: (peerId: string, locked: boolean) => void;
  onSetTeamRole: (peerId: string, next: { team?: TeamColor; role?: PlayerRole }) => void;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
}

const AVATARS = ["🕵️", "🔴", "🔵", "🗝️", "📜", "🕶️", "🔎", "🧩"];

export function Lobby(props: LobbyProps) {
  const {
    myPeerId,
    hostPeerId,
    isHost,
    players,
    spectators,
    spectatorLocks,
    status,
    error,
    config,
    isEmbedded,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
    disconnect,
    onSetRole,
    onLockSpectator,
    onSetTeamRole,
    onChangeConfig,
  } = props;

  if (status === "CONNECTED" && myPeerId) {
    return (
      <LobbyRoom
        hostPeerId={hostPeerId}
        isHost={isHost}
        players={players}
        spectators={spectators}
        spectatorLocks={spectatorLocks}
        myPeerId={myPeerId}
        config={config}
        isEmbedded={isEmbedded}
        onSetRole={onSetRole}
        onLockSpectator={onLockSpectator}
        onSetTeamRole={onSetTeamRole}
        onChangeConfig={onChangeConfig}
        startGame={startGame}
        toggleReady={toggleReady}
        disconnect={disconnect}
      />
    );
  }

  return <LobbyHome status={status} error={error} hostRoom={hostRoom} joinRoom={joinRoom} />;
}

export default Lobby;

function LobbyHome({
  status,
  error,
  hostRoom,
  joinRoom,
}: {
  status: string;
  error: string | null;
  hostRoom: (name: string, avatar: string, enableVoice?: boolean, enableTextChat?: boolean) => Promise<void>;
  joinRoom: (name: string, avatar: string, roomId: string) => Promise<void>;
}) {
  return (
    <P2PlayLobby
      title="SPY WORDS"
      subtitle="Cassez le code, évitez l'assassin et menez votre équipe à la victoire."
      bannerEmoji="🕵️"
      theme="violet"
      avatars={AVATARS}
      status={status}
      error={error}
      maxUsernameLength={14}
      showVoiceToggle={true}
      showTextChatToggle={true}
      showCharacterCounter={false}
      subtitleTransform="none"
      usernameLabel="Pseudonyme"
      usernamePlaceholder="Entrez votre nom..."
      avatarLabel="Choisir un Avatar"
      createButtonText="Créer une Table"
      joinCodeLabel="Code de la table"
      joinCodePlaceholder="CODE"
      joinButtonText="Rejoindre"
      joinLayout="side-by-side"
      onCreateRoom={(_code, username, avatar, enableVoice, enableTextChat) => {
        void hostRoom(username, avatar, enableVoice, enableTextChat);
      }}
      onJoin={(username, avatar, roomCode) => {
        void joinRoom(username, avatar, roomCode);
      }}
      classes={{
        root: "max-w-md mx-auto p-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative",
        header: "text-center mb-8",
        emoji: "text-5xl inline-block mb-3 animate-bounce",
        title:
          "text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent whitespace-nowrap",
        subtitle: "text-zinc-400 text-sm mt-1",
        content: "space-y-5",
        label: "block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2",
        input:
          "w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-zinc-100 outline-none transition-all disabled:opacity-50",
        avatarGrid: "grid grid-cols-8 gap-2 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/60",
        avatarItem:
          "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square border-2 border-transparent hover:bg-zinc-850",
        avatarItemSelected:
          "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square bg-amber-500/20 border-2 border-amber-500 scale-110",
        hr: "border-t border-zinc-800/60",
        actionGroup: "flex flex-col gap-3",
        createButton:
          "w-full py-3.5 px-6 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/5",
        divider: "relative flex py-2 items-center",
        dividerLine: "flex-grow border-t border-zinc-800/60",
        dividerText: "flex-shrink mx-4 text-zinc-500 text-xs font-bold uppercase tracking-widest",
        joinWrapper: "space-y-2",
        joinGroup: "flex gap-2",
        joinInput:
          "w-1/3 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-zinc-100 text-center outline-none transition-all font-mono tracking-wider",
        joinButton:
          "flex-grow py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/15",
        urlNotice: "p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-left flex flex-col gap-4",
        error: "text-rose-500 text-sm p-3 rounded-xl bg-rose-500/10 border border-rose-500/20",
      }}
    />
  );
}

function LobbyRoom({
  hostPeerId,
  isHost,
  players,
  spectators,
  spectatorLocks,
  myPeerId,
  config,
  isEmbedded,
  onSetRole,
  onLockSpectator,
  onSetTeamRole,
  onChangeConfig,
  startGame,
  toggleReady,
  disconnect,
}: {
  hostPeerId: string | null;
  isHost: boolean;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  myPeerId: string | null;
  config?: GameConfig;
  isEmbedded?: boolean;
  onSetRole: (peerId: string, role: PlayerRole) => void;
  onLockSpectator: (peerId: string, locked: boolean) => void;
  onSetTeamRole: (peerId: string, next: { team?: TeamColor; role?: PlayerRole }) => void;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
  startGame: () => void;
  toggleReady: (ready: boolean) => void;
  disconnect: () => void;
}) {
  const [localReady, setLocalReady] = useState(false);
  const timer = config?.timer ?? "OFF";
  const customWords = config?.customWords ?? [];

  const redMaster = players.some((p) => p.team === "RED" && p.role === "MASTERMIND");
  const blueMaster = players.some((p) => p.team === "BLUE" && p.role === "MASTERMIND");
  const redAgents = players.filter((p) => p.team === "RED" && p.role === "AGENT").length;
  const blueAgents = players.filter((p) => p.team === "BLUE" && p.role === "AGENT").length;
  const canStart =
    players.length >= 4 && redMaster && blueMaster && redAgents >= 1 && blueAgents >= 1;

  const handleReady = () => {
    const next = !localReady;
    setLocalReady(next);
    toggleReady(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Salon : {hostPeerId}
          </h1>
          {hostPeerId && (
            <CopyRoomLinkButton
              code={hostPeerId}
              className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
            />
          )}
        </div>
        <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-400 font-mono">
          {isHost ? "HÔTE" : "INVITÉ"}
        </Badge>
      </div>
      <p className="text-zinc-400 text-sm mb-4">
        2 équipes (Rouge / Bleue), 1 Mastermind + au moins 1 Agent par équipe.
      </p>

      <ConfigPanel
        isHost={isHost}
        timer={timer}
        customWords={customWords}
        enableTextChat={config?.enableTextChat}
        isEmbedded={isEmbedded}
        onChangeConfig={onChangeConfig}
      />

      <TeamRolePanel
        players={players}
        myPeerId={myPeerId}
        isHost={isHost}
        onSetTeamRole={onSetTeamRole}
      />

      <SpectatorRolePanel
        players={players}
        spectators={spectators}
        spectatorLocks={spectatorLocks}
        myPeerId={myPeerId}
        isHost={isHost}
        onSetRole={onSetRole}
        onLockSpectator={onLockSpectator}
      />

      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-lg font-bold text-zinc-200">
          Espions connectés ({players.length})
          {spectators.length > 0 && (
            <span className="text-sky-300/80 text-sm"> · 👁 {spectators.length} spectateur(s)</span>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">{p.name}</span>
                  {p.id === myPeerId && <span className="text-xs text-amber-400">(Vous)</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    p.team === "RED"
                      ? "bg-red-500/15 text-red-300 border-red-500/30"
                      : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                  }`}
                >
                  {p.team}
                </span>
                <Badge
                  variant={p.isHost ? "default" : p.isReady ? "secondary" : "outline"}
                  className={
                    p.isHost
                      ? "w-20 justify-center bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                      : p.isReady
                        ? "w-20 justify-center bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                        : "w-20 justify-center bg-zinc-800 text-zinc-500 text-[10px]"
                  }
                >
                  {p.isHost ? "Hôte" : p.isReady ? "Prêt" : "Attente"}
                </Badge>
                {p.disconnected && (
                  <Badge className="bg-zinc-800 text-zinc-500 text-[10px]">Déco</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/60">
        {!isHost && (
          <Button
            type="button"
            onClick={handleReady}
            className={`flex-1 h-auto py-3.5 px-6 rounded-2xl font-bold ${
              localReady
                ? "bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-lg shadow-amber-900/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            {localReady ? "Pas Prêt" : "Je suis Prêt !"}
          </Button>
        )}
        {isHost && (
          <Button
            type="button"
            onClick={startGame}
            disabled={!canStart}
            className="flex-1 h-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-bold disabled:opacity-40 shadow-lg shadow-amber-500/20"
          >
            Lancer la partie ({players.length})
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={disconnect}
          className="h-auto py-3.5 px-6 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
        >
          Quitter
        </Button>
      </div>
    </div>
  );
}

function ConfigPanel({
  isHost,
  timer,
  customWords,
  enableTextChat = true,
  isEmbedded,
  onChangeConfig,
}: {
  isHost: boolean;
  timer: TimerMode;
  customWords: string[];
  enableTextChat?: boolean;
  isEmbedded?: boolean;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
}) {
  const [wordsText, setWordsText] = useState(customWords.join(", "));
  const timers: TimerMode[] = ["OFF", 60, 90, 120];

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col gap-4">
      <div>
        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
          Minuteur par tour
        </div>
        {isHost ? (
          <div className="flex gap-2">
            {timers.map((t) => (
              <Button
                key={String(t)}
                type="button"
                variant="outline"
                onClick={() => onChangeConfig?.({ timer: t })}
                className={`h-auto p-2 rounded-xl border-2 text-sm ${
                  timer === t
                    ? "bg-amber-500/15 border-amber-500 text-amber-200"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {t === "OFF" ? "Aucun" : `${t}s`}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
            Minuteur : {timer === "OFF" ? "Aucun" : `${timer}s`}
          </div>
        )}
      </div>

      {isEmbedded && (
        <div>
          <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
            Chat Textuel P2P (Anti-triche)
          </div>
          {isHost ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onChangeConfig?.({ enableTextChat: enableTextChat === false })}
              className={`h-auto p-2.5 rounded-xl border-2 text-sm flex items-center gap-2 ${
                enableTextChat !== false
                  ? "bg-amber-500/15 border-amber-500 text-amber-200"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              <span>{enableTextChat !== false ? "💬 Chat Actif" : "🚫 Chat Désactivé (Anti-triche)"}</span>
            </Button>
          ) : (
            <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
              Chat textuel : {enableTextChat !== false ? "Actif" : "Désactivé (Anti-triche)"}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
          Mots personnalisés (optionnel)
        </div>
        {isHost ? (
          <>
            <textarea
              value={wordsText}
              onChange={(e) => setWordsText(e.target.value)}
              onBlur={() => {
                const list = wordsText
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean);
                onChangeConfig?.({ customWords: list });
              }}
              placeholder="Mots1, Mots2, Mots3…"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-zinc-100 text-sm outline-none min-h-[60px]"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Fusionnés avec le dictionnaire par défaut (priorité aux vôtres).
            </p>
          </>
        ) : (
          <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
            {customWords.length} mot(s) personnalisé(s)
          </div>
        )}
      </div>
    </div>
  );
}