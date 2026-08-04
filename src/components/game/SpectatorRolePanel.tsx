import React from "react";
import type { Player, PlayerRole, Spectator } from "../../core/types";

interface SpectatorRolePanelProps {
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: { [peerId: string]: boolean };
  myPeerId: string | null;
  isHost: boolean;
  onSetRole: (peerId: string, role: PlayerRole) => void;
  onLockSpectator: (peerId: string, locked: boolean) => void;
}

const RoleBadge: React.FC<{ isSpectator: boolean }> = ({ isSpectator }) => (
  <span
    className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border ${
      isSpectator
        ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }`}
  >
    {isSpectator ? "👁 Spectateur" : "🕵️ Joueur"}
  </span>
);

export const SpectatorRolePanel: React.FC<SpectatorRolePanelProps> = ({
  players,
  spectators,
  spectatorLocks,
  myPeerId,
  isHost,
  onSetRole,
  onLockSpectator,
}) => {
  type Entry = (Player | Spectator) & { isSpec?: boolean };
  const all: Entry[] = [
    ...players.map((p) => ({ ...p, isSpec: false })),
    ...spectators.map((s) => ({ ...s, isSpec: true, role: "spectator" as const })),
  ];

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col gap-2">
      <div className="text-xs text-amber-500 font-bold uppercase tracking-widest">
        Rôle (Joueur / Spectateur)
      </div>
      <p className="text-[11px] text-zinc-400">
        {isHost
          ? "Chacun choisit son rôle. Vous pouvez seulement forcer le mode spectateur (et verrouiller) — jamais forcer le mode joueur."
          : "Basculez votre propre rôle librement, sauf si l'hôte vous a verrouillé en spectateur."}
      </p>
      <div className="flex flex-col gap-1.5 mt-1">
        {all.map((p) => {
          const isSpec = p.isSpec === true;
          const isMe = p.id === myPeerId;
          const locked = !!spectatorLocks[p.id];
          const targetRole: PlayerRole = isSpec ? "AGENT" : "spectator";
          const isHostPlayer = "isHost" in p && p.isHost;
          const canToggle = isHostPlayer
            ? false
            : isMe
              ? (!isSpec || !locked)
              : isHost && !isSpec;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{p.avatar}</span>
                <span className="font-semibold text-zinc-100 truncate">
                  {p.name}
                  {isMe ? " (Vous)" : ""}
                  {isHostPlayer ? " 👑" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <RoleBadge isSpectator={isSpec} />
                {canToggle && (
                  <button
                    type="button"
                    onClick={() => onSetRole(p.id, targetRole)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
                    title={targetRole === "spectator" ? "Passer en spectateur" : "Redevenir joueur"}
                  >
                    → {targetRole === "spectator" ? "👁" : "🕵️"}
                  </button>
                )}
                {isHost && !isHostPlayer && (
                  <button
                    type="button"
                    onClick={() => onLockSpectator(p.id, !locked)}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                      locked
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                    }`}
                    title={
                      locked
                        ? "Déverrouiller (peut redevenir joueur)"
                        : "Forcer & verrouiller en spectateur"
                    }
                  >
                    {locked ? "🔒" : "🔓"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};