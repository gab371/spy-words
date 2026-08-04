import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachPresenceHandlers,
  createSeatEngine,
  handleJoinGameSeat,
} from "p2play-core/presence";
import { usePeer } from "./usePeer";
import { SpyWordsEngine } from "../core/gameEngine";
import {
  sanitizeGameState,
  sanitizeGameStateForSpectator,
} from "../network/protocol";
import type { NetworkMessage } from "../network/protocol";
import type { GameConfig, PlayerRole, TeamColor } from "../core/types";
import { installTestHooks, registerEngineGetter } from "../testHooks";

interface UseGameOptions {
  externalPeerManager?: import("p2play-core").PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isEmbedded?: boolean;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: unknown;
  hubPhase?: string;
}

export function useGame(options?: UseGameOptions) {
  const p2p = usePeer(options);
  const {
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    hostGame,
    joinGame,
    sendAction,
    sendChat,
    gameState,
    status,
    error,
    chatMessages,
    disconnect,
  } = p2p;

  const gameEngineRef = useRef<SpyWordsEngine | null>(null);
  const victoryPlayedRef = useRef(false);

  useEffect(() => {
    registerEngineGetter(() => gameEngineRef.current);
    installTestHooks();
  }, []);

  const [localPlayerName, setLocalPlayerName] = useState(options?.playerName || "");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState(
    options?.playerAvatar || "🕵️",
  );

  const broadcastSanitizedStates = useCallback(
    (engineState: Parameters<typeof sanitizeGameState>[0], overridePeerId?: string) => {
      const activePeerId = overridePeerId || myPeerId;
      if (!activePeerId) return;
      for (const p of engineState.players) {
        peerManager.registerPeerProfile?.(p.id, {
          username: p.name,
          avatar: p.avatar,
        });
      }
      for (const s of engineState.spectators) {
        peerManager.registerPeerProfile?.(s.id, {
          username: s.name,
          avatar: s.avatar,
        });
      }

      const sent = new Set<string>([activePeerId]);
      const resolveConn = (id: string) => {
        let conn = peerManager.connections.get(id);
        if (!conn) {
          for (const [peerId, connection] of peerManager.connections.entries()) {
            if (peerId.endsWith(id) || id.endsWith(peerId)) {
              conn = connection;
              break;
            }
          }
        }
        return conn;
      };

      p2p.peerManager.onStateReceived?.(
        JSON.parse(JSON.stringify(sanitizeGameState(engineState, activePeerId))),
      );

      engineState.players.forEach((p) => {
        if (p.id === activePeerId) return;
        const conn = resolveConn(p.id);
        if (conn?.open) {
          conn.send({
            type: "STATE_UPDATE",
            state: sanitizeGameState(engineState, p.id),
          });
          sent.add(p.id);
          sent.add(conn.peer);
        }
      });

      const spectatorView = sanitizeGameStateForSpectator(engineState);
      engineState.spectators.forEach((s) => {
        const conn = resolveConn(s.id);
        if (conn?.open) {
          conn.send({
            type: "STATE_UPDATE",
            state: JSON.parse(JSON.stringify(spectatorView)),
          });
          sent.add(s.id);
          sent.add(conn.peer);
        }
      });

      peerManager.connections.forEach((conn, peerId) => {
        if (!conn.open || sent.has(peerId) || sent.has(conn.peer)) return;
        conn.send({
          type: "STATE_UPDATE",
          state: JSON.parse(JSON.stringify(spectatorView)),
        });
      });
    },
    [myPeerId, peerManager, p2p.peerManager],
  );

  useEffect(() => {
    if (!isHost) {
      gameEngineRef.current = null;
      return;
    }
    if (!gameEngineRef.current) gameEngineRef.current = new SpyWordsEngine();
    const engine = gameEngineRef.current;

    if (
      options?.isEmbedded &&
      options?.externalPeerManager &&
      engine.state.phase === "LOBBY"
    ) {
      setTimeout(() => {
        engine.state.players = [];
        engine.addPlayer(
          myPeerId!,
          options.playerName || "Hôte",
          options.playerAvatar || "🕵️",
          true,
        );
        peerManager.lobbyPlayers?.forEach((p) => {
          if (p.peerId && p.peerId !== myPeerId) {
            engine.addPlayer(
              p.peerId,
              p.username || `Joueur ${p.peerId.slice(0, 4)}`,
              p.avatar || "👤",
              false,
            );
          }
        });
        broadcastSanitizedStates(engine.state);
      }, 0);
    }

    const getSeatEngine = () =>
      createSeatEngine({
        getPhase: () => engine.state.phase,
        getPlayers: () => engine.state.players,
        getSpectators: () => engine.state.spectators,
        markDisconnected: (id) => engine.markDisconnected(id),
        isDisconnected: (id) => engine.isDisconnected(id),
        remapPlayerId: (o, n, p) => engine.remapPlayerId(o, n, p),
        removePlayer: (id) => engine.removePlayer(id),
      });

    const presence = attachPresenceHandlers({
      peerManager,
      getEngine: getSeatEngine,
      onBroadcast: () => broadcastSanitizedStates(engine.state),
      onHostAction: (senderPeerId, actionMsg) => {
        const raw = actionMsg as NetworkMessage;
        const msg =
          raw.type === "ACTION"
            ? ({ ...raw, playerId: senderPeerId } as NetworkMessage)
            : raw;
        if (msg.type !== "ACTION") return;
        const { actionName, playerId, payload } = msg as Extract<
          NetworkMessage,
          { type: "ACTION" }
        >;

        switch (actionName) {
          case "JOIN_GAME":
            handleJoinGameSeat({
              engine: getSeatEngine(),
              playerId,
              payload: {
                name: payload?.name as string,
                avatar: payload?.avatar as string,
              },
              trustedName: peerManager.getTrustedUsername?.(playerId),
              isHostPlayer: playerId === myPeerId,
              addPlayer: (id, name, avatar, host) =>
                engine.addPlayer(id, name, avatar, host),
              addSpectator: (id, name, avatar) =>
                engine.addSpectator(id, name, avatar),
            });
            break;
          case "TOGGLE_READY":
            engine.setPlayerReady(playerId, !!payload.readyStatus);
            break;
          case "START_GAME":
            if (playerId === myPeerId) engine.startGame();
            break;
          case "CHANGE_CONFIG":
            if (playerId === myPeerId)
              engine.setConfig(payload.config as Partial<GameConfig>);
            break;
          case "SET_TEAM": {
            const targetId = payload.peerId as string;
            if (playerId === myPeerId || targetId === playerId) {
              engine.setTeam(targetId, payload.team as TeamColor);
            }
            break;
          }
          case "SET_TEAM_ROLE": {
            const targetId = payload.peerId as string;
            if (playerId === myPeerId || targetId === playerId) {
              if (payload.team) engine.setTeam(targetId, payload.team as TeamColor);
              if (payload.role)
                engine.setRole(
                  targetId,
                  payload.role as Exclude<PlayerRole, "spectator">,
                );
            }
            break;
          }
          case "SET_ROLE": {
            const targetId = payload.peerId as string;
            const nextRole = payload.role as PlayerRole;
            if (playerId === myPeerId || targetId === playerId) {
              engine.setPlayerRole(targetId, nextRole, {
                requesterPeerId: playerId,
                requesterIsHost: playerId === myPeerId,
              });
            }
            break;
          }
          case "LOCK_SPECTATOR":
            if (playerId === myPeerId) {
              const targetId = payload.peerId as string;
              const locked = !!payload.locked;
              if (locked) {
                engine.setPlayerRole(targetId, "spectator", {
                  requesterPeerId: playerId,
                  requesterIsHost: true,
                });
              }
              engine.setSpectatorLock(targetId, locked);
            }
            break;
          case "SUBMIT_CLUE": {
            const r = engine.submitClue(
              playerId,
              payload.clueWord as string,
              payload.count as number,
            );
            if (r.ok) playSfx("clue");
            break;
          }
          case "REVEAL_CARD": {
            const r = engine.revealCard(playerId, payload.cardId as string);
            if (r.ok) {
              const card = engine.state.cards.find(
                (c) => c.id === (payload.cardId as string),
              );
              if (card?.color === "ASSASSIN") playSfx("assassin");
              else if (card && card.color !== engine.state.activeTeam)
                playSfx("wrong");
              else playSfx("reveal");
            }
            break;
          }
          case "PASS_TURN":
            if (engine.passTurn(playerId).ok) playSfx("click");
            break;
          case "RESET_LOBBY":
            if (playerId === myPeerId) engine.resetToLobby();
            break;
        }

        broadcastSanitizedStates(engine.state);
        if (engine.state.phase === "GAME_OVER" && !victoryPlayedRef.current) {
          victoryPlayedRef.current = true;
          const mineWon = engine.state.players.some(
            (p) => p.id === myPeerId && p.team === engine.state.winnerTeam,
          );
          playSfx(mineWon ? "victory" : "defeat");
        } else if (engine.state.phase !== "GAME_OVER") {
          victoryPlayedRef.current = false;
        }
      },
    });

    return () => presence.dispose();
  }, [
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    broadcastSanitizedStates,
    options?.isEmbedded,
    options?.externalPeerManager,
    options?.playerName,
    options?.playerAvatar,
  ]);

  useEffect(() => {
    if (!options?.isEmbedded || isHost || !myPeerId) return;
    const name = options.playerName || localPlayerName || "Joueur";
    const avatar = options.playerAvatar || localPlayerAvatar || "👤";
    const sendJoin = () => {
      peerManager.sendToHost("ACTION", {
        actionName: "JOIN_GAME",
        playerId: myPeerId,
        payload: { name, avatar },
      });
    };
    const timers = [250, 1000, 2500].map((ms) => window.setTimeout(sendJoin, ms));
    return () => timers.forEach(clearTimeout);
  }, [
    options?.isEmbedded,
    options?.playerName,
    options?.playerAvatar,
    isHost,
    myPeerId,
    localPlayerName,
    localPlayerAvatar,
    peerManager,
  ]);

  const hostRoom = useCallback(
    async (
      name: string,
      avatar: string,
      enableVoice: boolean = true,
      enableTextChat: boolean = true
    ) => {
      setLocalPlayerName(name);
      setLocalPlayerAvatar(avatar);
      const roomId = await hostGame(undefined, { username: name, avatar });
      const engine = new SpyWordsEngine();
      engine.state.enableVoice = enableVoice;
      engine.state.enableTextChat = enableTextChat;
      gameEngineRef.current = engine;
      engine.addPlayer(roomId, name, avatar, true);
      broadcastSanitizedStates(engine.state, roomId);
    },
    [hostGame, broadcastSanitizedStates],
  );

  const joinRoom = useCallback(
    async (name: string, avatar: string, roomId: string) => {
      setLocalPlayerName(name);
      setLocalPlayerAvatar(avatar);
      const { peerId } = await joinGame(roomId, { username: name, avatar });
      setTimeout(() => {
        peerManager.sendToHost("ACTION", {
          actionName: "JOIN_GAME",
          playerId: peerId,
          payload: { name, avatar },
        });
      }, 1000);
    },
    [joinGame, peerManager],
  );

  const sendTurnAction = useCallback(
    (actionName: string, payload: Record<string, unknown> = {}) => {
      sendAction(actionName, { ...payload, turnNonce: gameState?.turnNonce ?? -1 });
    },
    [sendAction, gameState?.turnNonce],
  );

  return {
    isHost,
    myPeerId,
    hostPeerId: p2p.hostPeerId,
    connectedPeers: p2p.connectedPeers,
    peerManager,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady: (readyStatus: boolean) =>
      sendAction("TOGGLE_READY", { readyStatus }),
    startGame: () => sendAction("START_GAME", {}),
    changeConfig: (config: Partial<GameConfig>) =>
      sendAction("CHANGE_CONFIG", { config }),
    setTeam: (peerId: string, team: TeamColor) =>
      sendAction("SET_TEAM", { peerId, team }),
    setTeamRole: (
      peerId: string,
      next: { team?: TeamColor; role?: PlayerRole },
    ) => sendAction("SET_TEAM_ROLE", { peerId, ...next }),
    setRole: (peerId: string, role: PlayerRole) =>
      sendAction("SET_ROLE", { peerId, role }),
    lockSpectator: (peerId: string, locked: boolean) =>
      sendAction("LOCK_SPECTATOR", { peerId, locked }),
    submitClue: (clueWord: string, count: number) =>
      sendTurnAction("SUBMIT_CLUE", { clueWord, count }),
    revealCard: (cardId: string) => sendTurnAction("REVEAL_CARD", { cardId }),
    passTurn: () => sendTurnAction("PASS_TURN", {}),
    resetLobby: () => sendAction("RESET_LOBBY", {}),
    sendChatMessage: (text: string) => {
      if (gameState?.enableTextChat === false) return;
      sendChat(localPlayerName || "Espion", text);
    },
    disconnect,
    localPlayerName,
    localPlayerAvatar,
  };
}