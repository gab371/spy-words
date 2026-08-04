import React from "react";
import type { Player, PlayerRole, TeamColor } from "../../core/types";

interface TeamRolePanelProps {
  players: Player[];
  myPeerId: string | null;
  isHost: boolean;
  onSetTeamRole: (peerId: string, next: { team?: TeamColor; role?: PlayerRole }) => void;
}

const TEAM_LABEL: Record<TeamColor, string> = {
  RED: "Rouge",
  BLUE: "Bleu",
};

const ROLE_LABEL: Record<string, string> = {
  MASTERMIND: "Mastermind",
  AGENT: "Agent",
};

/** Lobby team + role assignment (RED/BLUE × Mastermind/Agent). */
export const TeamRolePanel: React.FC<TeamRolePanelProps> = ({
  players,
  myPeerId,
  isHost,
  onSetTeamRole,
}) => {
  const redCount = players.filter((p) => p.team === "RED").length;
  const blueCount = players.filter((p) => p.team === "BLUE").length;
  const redMaster = players.some((p) => p.team === "RED" && p.role === "MASTERMIND");
  const blueMaster = players.some((p) => p.team === "BLUE" && p.role === "MASTERMIND");

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest">
          Équipes & Rôles
        </div>
        <div className="flex gap-3 text-[11px]">
          <span className={`font-semibold ${redMaster ? "text-red-400" : "text-zinc-500"}`}>
            🔴 M {redMaster ? "OK" : "—"}
          </span>
          <span className={`font-semibold ${blueMaster ? "text-blue-400" : "text-zinc-500"}`}>
            🔵 M {blueMaster ? "OK" : "—"}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400">
        Chaque équipe a besoin d'exactement un Mastermind. Les autres joueurs sont des Agents.
        {isHost ? " En tant qu'hôte, vous pouvez répartir les joueurs." : " Choisissez votre équipe et votre rôle."}
      </p>
      <div className="flex flex-col gap-1.5">
        {players.map((p) => {
          const isMe = p.id === myPeerId;
          const canEdit = isMe || (isHost && !p.isHost);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 flex-wrap"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{p.avatar}</span>
                <span className="font-semibold text-zinc-100 truncate">
                  {p.name}
                  {isMe ? " (Vous)" : ""}
                  {p.isHost ? " 👑" : ""}
                </span>
              </div>
              {canEdit ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <TeamPicker
                    value={p.team}
                    onChange={(team) => onSetTeamRole(p.id, { team })}
                  />
                  <RolePicker
                    value={p.role === "spectator" ? "AGENT" : p.role}
                    onChange={(role) =>
                      onSetTeamRole(p.id, { role: role as PlayerRole })
                    }
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`px-2 py-1 rounded-full border ${
                      p.team === "RED"
                        ? "bg-red-500/15 text-red-300 border-red-500/30"
                        : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                    }`}
                  >
                    {TEAM_LABEL[p.team]}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-800/50">
                    {ROLE_LABEL[p.role] ?? p.role}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>🔴 {redCount} joueur(s)</span>
        <span>🔵 {blueCount} joueur(s)</span>
      </div>
    </div>
  );
};

function TeamPicker({
  value,
  onChange,
}: {
  value: TeamColor;
  onChange: (team: TeamColor) => void;
}) {
  return (
    <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
      {(["RED", "BLUE"] as TeamColor[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={value === t}
          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
            value === t
              ? t === "RED"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {TEAM_LABEL[t]}
        </button>
      ))}
    </div>
  );
}

function RolePicker({
  value,
  onChange,
}: {
  value: "MASTERMIND" | "AGENT";
  onChange: (role: "MASTERMIND" | "AGENT") => void;
}) {
  return (
    <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
      {(["MASTERMIND", "AGENT"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          aria-pressed={value === r}
          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
            value === r
              ? "bg-amber-500 text-zinc-950"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}