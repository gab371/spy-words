import type { GameLog, GameState, Player, PlayerRole, TeamColor } from "./types";
import { canChangeRole, spectatorConfigFromIds } from "p2play-core/spectator";
import { remapRecordKey } from "p2play-core/presence";

export function logMessage(
  state: GameState,
  message: string,
  type: GameLog["type"] = "info",
): void {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  state.logs.unshift({
    id: Math.random().toString(36).substring(2, 9),
    timestamp,
    message,
    type,
  });
  if (state.logs.length > 60) state.logs.pop();
}

export function addPlayer(
  state: GameState,
  id: string,
  name: string,
  avatar: string,
  isHost: boolean,
): void {
  if (state.phase !== "LOBBY") return;
  if (state.players.find((p) => p.id === id)) return;
  state.players.push({
    id,
    name,
    avatar,
    isHost,
    role: isHost ? "MASTERMIND" : "AGENT",
    isReady: false,
    team: "RED",
  });
  logMessage(state, `${name} a rejoint le salon.`, "system");
}

export function addSpectator(
  state: GameState,
  id: string,
  name: string,
  avatar: string,
): void {
  const existing =
    state.players.find((p) => p.id === id) ||
    state.spectators.find((s) => s.id === id);
  if (existing) return;
  state.spectators.push({ id, name, avatar });
  logMessage(state, `${name} rejoint en tant que spectateur.`, "system");
}

export function setPlayerRole(
  state: GameState,
  id: string,
  role: PlayerRole,
  requester: { requesterPeerId: string; requesterIsHost: boolean },
): boolean {
  if (state.phase !== "LOBBY") return false;

  // Spectator ⇄ player transitions use the shared spectator policy.
  const config = spectatorConfigFromIds(
    state.spectators.map((s) => s.id),
    state.spectatorLocks,
  );
  const nextIsSpectator = role === "spectator";
  if (
    !canChangeRole(id, config, {
      requesterPeerId:
        requester.requesterPeerId ||
        state.players.find((p) => p.isHost)?.id ||
        id,
      requesterIsHost: requester.requesterIsHost,
      nextRole: nextIsSpectator ? "spectator" : "player",
    })
  ) {
    return false;
  }

  if (nextIsSpectator) {
    const p = state.players.find((pl) => pl.id === id);
    if (!p || p.isHost) return false;
    state.players = state.players.filter((pl) => pl.id !== id);
    state.spectators.push({ id, name: p.name, avatar: p.avatar });
    logMessage(state, `${p.name} devient spectateur.`, "system");
    return true;
  }

  // Becoming a player — pick role/team based on previous (or default).
  const s = state.spectators.find((sp) => sp.id === id);
  if (!s) {
    // Already a player — just switch internal role (MASTERMIND/AGENT).
    const p = state.players.find((pl) => pl.id === id);
    if (!p) return false;
    p.role = role as Exclude<PlayerRole, "spectator">;
    return true;
  }
  state.spectators = state.spectators.filter((sp) => sp.id !== id);
  state.players.push({
    id,
    name: s.name,
    avatar: s.avatar,
    isHost: false,
    role: role as Exclude<PlayerRole, "spectator">,
    isReady: false,
    team: defaultTeamFor(state),
  });
  logMessage(state, `${s.name} rejoint les joueurs.`, "system");
  return true;
}

export function setSpectatorLock(
  state: GameState,
  peerId: string,
  locked: boolean,
): void {
  if (locked) {
    const asPlayer = state.players.find((p) => p.id === peerId);
    if (asPlayer && !asPlayer.isHost) {
      setPlayerRole(state, peerId, "spectator", {
        requesterPeerId: state.players.find((p) => p.isHost)?.id || peerId,
        requesterIsHost: true,
      });
    }
  }
  state.spectatorLocks[peerId] = locked;
}

export function setTeam(
  state: GameState,
  playerId: string,
  team: TeamColor,
): boolean {
  if (state.phase !== "LOBBY") return false;
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return false;
  p.team = team;
  return true;
}

export function setRole(
  state: GameState,
  playerId: string,
  role: Exclude<PlayerRole, "spectator">,
): boolean {
  if (state.phase !== "LOBBY") return false;
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return false;
  p.role = role;
  return true;
}

export function markDisconnected(state: GameState, id: string): void {
  const p = state.players.find((pl) => pl.id === id);
  if (p) {
    p.disconnected = true;
    logMessage(state, `${p.name} s'est déconnecté (reconnexion possible).`, "system");
    return;
  }
  const s = state.spectators.find((sp) => sp.id === id);
  if (s) s.disconnected = true;
}

export function isDisconnected(state: GameState, id: string): boolean {
  return (
    !!state.players.find((p) => p.id === id)?.disconnected ||
    !!state.spectators.find((s) => s.id === id)?.disconnected
  );
}

export function remapPlayerId(
  state: GameState,
  oldId: string,
  newId: string,
  profile?: { username?: string; avatar?: string },
): boolean {
  const p = state.players.find((pl) => pl.id === oldId);
  if (p) {
    p.id = newId;
    p.disconnected = false;
    if (profile?.avatar) p.avatar = profile.avatar;
    // Name locked at first seat.
    remapRecordKey(state.spectatorLocks, oldId, newId);
    logMessage(state, `${p.name} s'est reconnecté.`, "system");
    return true;
  }
  const s = state.spectators.find((sp) => sp.id === oldId);
  if (s) {
    s.id = newId;
    s.disconnected = false;
    if (profile?.avatar) s.avatar = profile.avatar;
    remapRecordKey(state.spectatorLocks, oldId, newId);
    return true;
  }
  return false;
}

export function removePlayer(state: GameState, id: string): boolean {
  const idx = state.players.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const p = state.players[idx];
    state.players.splice(idx, 1);
    logMessage(state, `${p.name} a quitté le salon.`, "system");
    return true;
  }
  const sidx = state.spectators.findIndex((s) => s.id === id);
  if (sidx !== -1) {
    const s = state.spectators[sidx];
    state.spectators.splice(sidx, 1);
    logMessage(state, `${s.name} (spectateur) a quitté le salon.`, "system");
    return true;
  }
  return false;
}

/** Pick the team with the fewest players (ties → RED). */
export function defaultTeamFor(state: GameState): TeamColor {
  const red = state.players.filter((p) => p.team === "RED").length;
  const blue = state.players.filter((p) => p.team === "BLUE").length;
  return blue < red ? "BLUE" : "RED";
}