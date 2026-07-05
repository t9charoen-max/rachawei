import type { Card, Rank, Suit } from './types';

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];

const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};

const SUIT_VALUE: Record<Suit, number> = {
  spades: 4,
  clubs: 3,
  diamonds: 2,
  hearts: 1,
};

export const SUIT_LABEL: Record<Suit, string> = {
  spades: 'โพดำ',
  clubs: 'ข้าวหลามตัด',
  diamonds: 'ดอกจิก',
  hearts: 'โพแดง',
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spades: '#1a1a2e',
  clubs: '#1a1a2e',
  diamonds: '#c0392b',
  hearts: '#c0392b',
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function compareCards(a: Card, b: Card): number {
  const rankDiff = RANK_VALUE[a.rank] - RANK_VALUE[b.rank];
  if (rankDiff !== 0) return rankDiff;
  return SUIT_VALUE[a.suit] - SUIT_VALUE[b.suit];
}

export function dealCards(playerCount: number): Card[] {
  if (playerCount < 3 || playerCount > 10) {
    throw new Error('ต้องมีผู้เล่น 3–10 คน');
  }
  return shuffleDeck(createDeck()).slice(0, playerCount);
}

export const PUNISHMENTS = [
  'ดื่มน้ำ 1 แก้ว',
  'วิดพื้น 10 ครั้ง',
  'บอกรักเพื่อนที่นั่งข้างๆ',
  'ร้องเพลง 1 ท่อน',
  'เล่าเรื่องตลก 1 เรื่อง',
  'ทำหน้าตลก 10 วินาที',
  'โพสท่าให้เพื่อนถ่ายรูป',
  'เล่าเรื่องน่าอาย 1 เรื่อง',
] as const;
