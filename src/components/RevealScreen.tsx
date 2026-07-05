import type { Player } from '../game/types';
import { compareCards } from '../game/cards';
import { PlayingCard } from './PlayingCard';

interface RevealScreenProps {
  players: Player[];
  onContinue: () => void;
}

export function RevealScreen({ players, onContinue }: RevealScreenProps) {
  const sorted = [...players].sort((a, b) => {
    if (!a.card || !b.card) return 0;
    return compareCards(b.card, a.card);
  });

  const king = sorted[0];
  const traitor = sorted[sorted.length - 1];

  return (
    <section className="screen reveal-screen">
      <header className="screen-header">
        <h2>เปิดไพ่แล้ว!</h2>
      </header>

      <div className="reveal-grid">
        {sorted.map((player, i) => {
          const isKing = player.id === king?.id;
          const isTraitor = player.id === traitor?.id && players.length > 2;

          return (
            <div
              key={player.id}
              className={`reveal-player ${isKing ? 'reveal-player--king' : ''} ${isTraitor ? 'reveal-player--traitor' : ''}`}
            >
              {isKing && <span className="role-badge role-badge--king">👑 ราชาหวาย</span>}
              {isTraitor && <span className="role-badge role-badge--traitor">⚔️ กบฎ</span>}
              <PlayingCard card={player.card} size="sm" />
              <p className="reveal-player__name">{player.name}</p>
              <span className="reveal-player__rank">อันดับ {i + 1}</span>
            </div>
          );
        })}
      </div>

      <button type="button" className="btn btn--primary btn--full" onClick={onContinue}>
        ราชาลงโทษกบฎ
      </button>
    </section>
  );
}
