import type {
  Clue,
  CodenamesCard,
  GameConfig,
  GameState,
  Player,
  PlayerRole,
  TeamColor,
} from "./types";
import { DEFAULT_GAME_CONFIG, GRID_SIZE } from "./types";
import {
  addPlayer,
  addSpectator,
  isDisconnected,
  logMessage,
  markDisconnected,
  remapPlayerId,
  removePlayer,
  setPlayerRole,
  setRole,
  setSpectatorLock,
  setTeam,
} from "./lobby";
import {
  buildDictionary,
  generateCodenamesGrid,
} from "./gridGenerator";
import { DEFAULT_DICTIONARY } from "./dictionary";
import { isValidClue, maxGuessesForClue } from "./clueValidator";

function initialState(): GameState {
  return {
    phase: "LOBBY",
    config: structuredClone(DEFAULT_GAME_CONFIG),
    players: [],
    spectators: [],
    spectatorLocks: {},
    cards: [],
    startingTeam: "RED",
    activeTeam: "RED",
    currentClue: null,
    guessesMade: 0,
    hasGuessed: false,
    redRemaining: 0,
    blueRemaining: 0,
    turnDeadline: null,
    winnerTeam: null,
    lossCause: null,
    logs: [],
    turnNonce: 0,
  };
}

export class SpyWordsEngine {
  public state: GameState = initialState();

  addPlayer(id: string, name: string, avatar: string, isHost: boolean) {
    addPlayer(this.state, id, name, avatar, isHost);
  }
  addSpectator(id: string, name: string, avatar: string) {
    addSpectator(this.state, id, name, avatar);
  }
  removePlayer(id: string) {
    removePlayer(this.state, id);
  }
  setPlayerRole(
    targetId: string,
    role: PlayerRole,
    meta: { requesterPeerId: string; requesterIsHost: boolean },
  ) {
    return setPlayerRole(this.state, targetId, role, meta);
  }
  setSpectatorLock(peerId: string, locked: boolean) {
    setSpectatorLock(this.state, peerId, locked);
  }
  setPlayerReady(id: string, ready: boolean) {
    const p = this.state.players.find((pl) => pl.id === id);
    if (p) p.isReady = ready;
  }
  markDisconnected(id: string) {
    markDisconnected(this.state, id);
  }
  isDisconnected(id: string) {
    return isDisconnected(this.state, id);
  }
  remapPlayerId(oldId: string, newId: string, profile?: { username?: string; avatar?: string }) {
    return remapPlayerId(this.state, oldId, newId, profile);
  }
  setTeam(playerId: string, team: TeamColor) {
    return setTeam(this.state, playerId, team);
  }
  setRole(playerId: string, role: Exclude<PlayerRole, "spectator">) {
    return setRole(this.state, playerId, role);
  }

  setConfig(partial: Partial<GameConfig>): boolean {
    if (this.state.phase !== "LOBBY") return false;
    this.state.config = { ...this.state.config, ...partial };
    logMessage(this.state, "Configuration mise à jour.", "system");
    return true;
  }

  startGame(): boolean {
    const s = this.state;
    if (s.phase !== "LOBBY") return false;
    if (s.players.length < 4) return false;
    // Require at least one Mastermind per team.
    if (!hasMastermind(s, "RED") || !hasMastermind(s, "BLUE")) return false;

    const dictionary = buildDictionary(DEFAULT_DICTIONARY, s.config.customWords);
    const setup = generateCodenamesGrid(dictionary);
    s.cards = setup.cards;
    s.startingTeam = setup.startingTeam;
    s.activeTeam = setup.startingTeam;
    s.redRemaining = setup.redRemaining;
    s.blueRemaining = setup.blueRemaining;
    s.currentClue = null;
    s.guessesMade = 0;
    s.hasGuessed = false;
    s.winnerTeam = null;
    s.lossCause = null;
    s.turnNonce += 1;
    s.phase = "GIVING_CLUE";
    s.turnDeadline = computeDeadline(s);
    logMessage(
      s,
      `La partie commence ! Équipe ${setup.startingTeam} ouvre les hostilités.`,
      "system",
    );
    return true;
  }

  submitClue(
    playerId: string,
    clueWord: string,
    count: number,
  ): { ok: boolean; reason?: string } {
    const s = this.state;
    if (s.phase !== "GIVING_CLUE") return { ok: false, reason: "Phase invalide." };
    const mastermind = activeMastermind(s, playerId);
    if (!mastermind) return { ok: false, reason: "Vous n'êtes pas le Mastermind actif." };
    if (mastermind.team !== s.activeTeam)
      return { ok: false, reason: "Ce n'est pas le tour de votre équipe." };
    if (count < 0 || count > 9)
      return { ok: false, reason: "Le nombre doit être entre 0 et 9." };

    const result = isValidClue(clueWord, s.cards);
    if (!result.valid) return { ok: false, reason: result.reason };

    s.currentClue = { word: clueWord.trim(), count, team: s.activeTeam };
    s.guessesMade = 0;
    s.hasGuessed = false;
    s.phase = "GUESSING";
    s.turnDeadline = computeDeadline(s);
    logMessage(
      s,
      `Indice — "${s.currentClue.word}" (${count}) pour l'équipe ${s.activeTeam}.`,
      "clue",
    );
    return { ok: true };
  }

  /** Reveal a card as a guess from an Agent of the active team. */
  revealCard(playerId: string, cardId: string): { ok: boolean; reason?: string } {
    const s = this.state;
    if (s.phase !== "GUESSING") return { ok: false, reason: "Phase invalide." };
    const guesser = s.players.find((p) => p.id === playerId);
    if (!guesser || guesser.role === "spectator")
      return { ok: false, reason: "Vous n'êtes pas un joueur actif." };
    if (guesser.team !== s.activeTeam)
      return { ok: false, reason: "Ce n'est pas le tour de votre équipe." };
    if (guesser.role === "MASTERMIND")
      return { ok: false, reason: "Le Mastermind ne devine pas." };

    const clue = s.currentClue;
    if (!clue) return { ok: false, reason: "Aucun indice actif." };
    if (s.guessesMade >= maxGuessesForClue(clue.count))
      return { ok: false, reason: "Quota de devinettes atteint." };

    const card = s.cards.find((c) => c.id === cardId);
    if (!card) return { ok: false, reason: "Carte introuvable." };
    if (card.revealed) return { ok: false, reason: "Carte déjà révélée." };

    card.revealed = true;
    s.guessesMade += 1;
    s.hasGuessed = true;
    logMessage(
      s,
      `${guesser.name} révèle "${card.word}" — ${labelForColor(card.color)}.`,
      "reveal",
    );

    if (card.color === "ASSASSIN") {
      // Opposite team wins immediately.
      s.winnerTeam = s.activeTeam === "RED" ? "BLUE" : "RED";
      s.lossCause = "ASSASSIN";
      s.phase = "GAME_OVER";
      s.turnDeadline = null;
      logMessage(
        s,
        `Assassin ! L'équipe ${s.winnerTeam} remporte la victoire.`,
        "danger",
      );
      return { ok: true };
    }

    if (card.color === "NEUTRAL") {
      this.endTurn();
      return { ok: true };
    }

    if (card.color === "RED") s.redRemaining -= 1;
    if (card.color === "BLUE") s.blueRemaining -= 1;

    // Victory by exhaustion.
    const exhausted: TeamColor | null =
      s.redRemaining <= 0 ? "RED" : s.blueRemaining <= 0 ? "BLUE" : null;
    if (exhausted) {
      s.winnerTeam = exhausted;
      s.lossCause = null;
      s.phase = "GAME_OVER";
      s.turnDeadline = null;
      logMessage(s, `L'équipe ${exhausted} a trouvé tous ses mots !`, "success");
      return { ok: true };
    }

    // Wrong team card → end turn immediately.
    if (card.color !== s.activeTeam) {
      this.endTurn();
      return { ok: true };
    }

    // Correct card: keep guessing until quota reached.
    if (s.guessesMade >= maxGuessesForClue(clue.count)) {
      this.endTurn();
    }
    return { ok: true };
  }

  /** Pass the turn voluntarily (Agents, after at least one guess). */
  passTurn(playerId: string): { ok: boolean; reason?: string } {
    const s = this.state;
    if (s.phase !== "GUESSING") return { ok: false, reason: "Phase invalide." };
    const p = s.players.find((pl) => pl.id === playerId);
    if (!p || p.role === "spectator" || p.team !== s.activeTeam)
      return { ok: false, reason: "Action réservée à l'équipe active." };
    if (!s.hasGuessed)
      return { ok: false, reason: "Vous devez faire au moins une devinette." };
    this.endTurn();
    return { ok: true };
  }

  /** Tick the timer; ends the active turn on timeout. */
  tickTimer(now: number): boolean {
    const s = this.state;
    if (s.phase !== "GUESSING" && s.phase !== "GIVING_CLUE") return false;
    if (s.turnDeadline === null) return false;
    if (now < s.turnDeadline) return false;
    logMessage(
      s,
      `Temps écoulé pour l'équipe ${s.activeTeam}. Tour passé.`,
      "warning",
    );
    this.endTurn();
    return true;
  }

  resetToLobby(): void {
    const s = this.state;
    s.phase = "LOBBY";
    s.cards = [];
    s.currentClue = null;
    s.guessesMade = 0;
    s.hasGuessed = false;
    s.redRemaining = 0;
    s.blueRemaining = 0;
    s.turnDeadline = null;
    s.winnerTeam = null;
    s.lossCause = null;
    s.players.forEach((p) => {
      p.isReady = false;
    });
    logMessage(s, "Retour au salon.", "system");
  }

  private endTurn(): void {
    const s = this.state;
    s.activeTeam = s.activeTeam === "RED" ? "BLUE" : "RED";
    s.currentClue = null;
    s.guessesMade = 0;
    s.hasGuessed = false;
    s.phase = "GIVING_CLUE";
    s.turnNonce += 1;
    s.turnDeadline = computeDeadline(s);
  }
}

function activeMastermind(
  s: GameState,
  playerId: string,
): Player | undefined {
  const p = s.players.find((pl) => pl.id === playerId);
  if (!p || p.role !== "MASTERMIND") return undefined;
  return p;
}

function hasMastermind(s: GameState, team: TeamColor): boolean {
  return s.players.some((p) => p.team === team && p.role === "MASTERMIND");
}

function computeDeadline(s: GameState): number | null {
  if (s.config.timer === "OFF") return null;
  return Date.now() + (s.config.timer as number) * 1000;
}

function labelForColor(color: CodenamesCard["color"]): string {
  switch (color) {
    case "RED":
      return "ROUGE";
    case "BLUE":
      return "BLEU";
    case "NEUTRAL":
      return "NEUTRE";
    case "ASSASSIN":
      return "ASSASSIN";
  }
}