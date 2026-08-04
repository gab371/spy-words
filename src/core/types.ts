export type TeamColor = 'RED' | 'BLUE';
export type CardColor = 'RED' | 'BLUE' | 'NEUTRAL' | 'ASSASSIN';

/** Player role within a Spy Words team. */
export type PlayerRole = 'MASTERMIND' | 'AGENT' | 'spectator';

export type GamePhase =
  | 'LOBBY'
  | 'GIVING_CLUE'
  | 'GUESSING'
  | 'GAME_OVER';

export interface CodenamesCard {
  id: string;
  word: string;
  color: CardColor;
  revealed: boolean;
  /** Masked=true means the real color is hidden from this viewer (Agent/spectator). */
  isMasked?: boolean;
  /** Local-only doubt mark (🤔), set via right-click. Never transmitted to peers. */
  doubtMark?: boolean;
}

export interface Clue {
  word: string;
  count: number;
  /** Team that issued the clue. */
  team: TeamColor;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  role: PlayerRole;
  isReady: boolean;
  team: TeamColor;
  disconnected?: boolean;
}

export interface Spectator {
  id: string;
  name: string;
  avatar: string;
  disconnected?: boolean;
}

export type TimerMode = 'OFF' | 60 | 90 | 120;

export interface GameConfig {
  /** Optional custom words supplied by host; merged with the default dictionary. */
  customWords: string[];
  timer: TimerMode;
  enableTextChat?: boolean;
}

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'system' | 'warning' | 'success' | 'danger' | 'action' | 'clue' | 'reveal';
}

export interface GridSetup {
  startingTeam: TeamColor;
  cards: CodenamesCard[];
  redRemaining: number;
  blueRemaining: number;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  cards: CodenamesCard[];
  startingTeam: TeamColor;
  activeTeam: TeamColor;
  currentClue: Clue | null;
  /** Guesses made for the current clue (capped at count + 1). */
  guessesMade: number;
  /** Whether at least one guess was made this turn (Pass enabled after it). */
  hasGuessed: boolean;
  redRemaining: number;
  blueRemaining: number;
  /** Turn deadline (epoch ms) when config.timer is active, else null. */
  turnDeadline: number | null;
  winnerTeam: TeamColor | null;
  /** "ASSASSIN" if the losing cause was the assassin card, else null. */
  lossCause: 'ASSASSIN' | null;
  logs: GameLog[];
  /**
   * Bumps on every turn change. Clients echo it on actions; host rejects
   * mismatched nonces so queued/spam guesses cannot apply on a later turn.
   */
  turnNonce: number;
  enableVoice?: boolean;
  enableTextChat?: boolean;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  customWords: [],
  timer: 'OFF',
};

export const GRID_SIZE = 25;
export const GRID_COLUMNS = 5;