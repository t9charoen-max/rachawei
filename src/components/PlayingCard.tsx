import type { Card as CardType } from '../game/types';
import { SUIT_COLOR, SUIT_LABEL, SUIT_SYMBOL } from '../game/cards';

interface PlayingCardProps {
  card: CardType | null;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE_CLASS = {
  sm: 'card--sm',
  md: 'card--md',
  lg: 'card--lg',
} as const;

export function PlayingCard({ card, hidden = false, size = 'md', label }: PlayingCardProps) {
  if (hidden || !card) {
    return (
      <div className={`playing-card ${SIZE_CLASS[size]} playing-card--back`}>
        <div className="playing-card__pattern" />
        <span className="playing-card__crown">👑</span>
        {label && <span className="playing-card__label">{label}</span>}
      </div>
    );
  }

  const color = SUIT_COLOR[card.suit];
  const isRed = card.suit === 'diamonds' || card.suit === 'hearts';

  return (
    <div className={`playing-card ${SIZE_CLASS[size]} ${isRed ? 'playing-card--red' : ''}`}>
      <div className="playing-card__corner playing-card__corner--tl" style={{ color }}>
        <span className="playing-card__rank">{card.rank}</span>
        <span className="playing-card__suit">{SUIT_SYMBOL[card.suit]}</span>
      </div>
      <div className="playing-card__center" style={{ color }}>
        {SUIT_SYMBOL[card.suit]}
      </div>
      <div className="playing-card__corner playing-card__corner--br" style={{ color }}>
        <span className="playing-card__rank">{card.rank}</span>
        <span className="playing-card__suit">{SUIT_SYMBOL[card.suit]}</span>
      </div>
      <span className="playing-card__suit-name">{SUIT_LABEL[card.suit]}</span>
      {label && <span className="playing-card__label">{label}</span>}
    </div>
  );
}
