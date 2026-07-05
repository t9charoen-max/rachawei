export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  card: Card | null;
  hasSwapped: boolean;
}

export type GamePhase =
  | 'home'
  | 'howto'
  | 'setup'
  | 'dealing'
  | 'bluff'
  | 'countdown'
  | 'reveal'
  | 'punishment'
  | 'result';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  countdown: number;
  kingId: string | null;
  traitorId: string | null;
  selectedPunishment: string | null;
}
