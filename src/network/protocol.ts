import type { GameState, PlayerRole, TeamColor, TimerMode } from "../core/types";
import { sanitizeForPlayer, sanitizeForSpectator } from "./sanitizer";

export type MessageType =
  | "JOIN"
  | "STATE_UPDATE"
  | "ACTION"
  | "CHAT"
  | "AUDIO_EVENT";

export type ClientActionType =
  | "JOIN_GAME"
  | "TOGGLE_READY"
  | "START_GAME"
  | "SET_ROLE"
  | "LOCK_SPECTATOR"
  | "SET_TEAM"
  | "SET_TEAM_ROLE"
  | "CHANGE_CONFIG"
  | "SUBMIT_CLUE"
  | "REVEAL_CARD"
  | "PASS_TURN"
  | "RESET_LOBBY";

export interface ActionMessage {
  type: "ACTION";
  actionName: ClientActionType;
  playerId: string;
  payload: Record<string, unknown>;
}

export type NetworkMessage = ActionMessage | { type: "STATE_UPDATE"; state: GameState };

export function sanitizeGameState(state: GameState, targetPlayerId: string): GameState {
  return sanitizeForPlayer(state, targetPlayerId);
}

export function sanitizeGameStateForSpectator(state: GameState): GameState {
  return sanitizeForSpectator(state);
}

export interface SubmitCluePayload {
  clueWord: string;
  count: number;
  turnNonce: number;
}

export interface ChangeConfigPayload {
  config: { customWords?: string[]; timer?: TimerMode };
}

export interface SetTeamRolePayload {
  peerId: string;
  team?: TeamColor;
  role?: PlayerRole;
}