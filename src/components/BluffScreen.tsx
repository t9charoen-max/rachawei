import type { Player } from '../game/types';
import { PlayingCard } from './PlayingCard';

interface BluffScreenProps {
  players: Player[];
  currentIndex: number;
  onKeep: () => void;
  onSwap: () => void;
}

export function BluffScreen({ players, currentIndex, onKeep, onSwap }: BluffScreenProps) {
  const current = players[currentIndex];
  const canSwap = current && !current.hasSwapped;

  return (
    <section className="screen bluff-screen">
      <header className="screen-header">
        <h2>รอบบลัฟ</h2>
        <p className="screen-subtitle">
          ผู้เล่นที่ {currentIndex + 1}/{players.length}
        </p>
      </header>

      <div className="bluff-turn">
        <div className="bluff-turn__player">
          <span className="bluff-turn__badge">ตาของ</span>
          <h3 className="bluff-turn__name">{current?.name}</h3>
        </div>

        <p className="bluff-turn__instruction">
          {canSwap
            ? 'เพื่อนบอกว่าไพ่คุณเป็นอะไร — จะเก็บไพ่หรือจั่วใหม่? (จั่วได้ครั้งเดียว)'
            : 'คุณจั่วไพ่ใหม่ไปแล้ว — กดเก็บไพ่เพื่อไปตาถัดไป'}
        </p>

        <div className="bluff-turn__others">
          <p className="bluff-turn__others-title">ไพ่ของคนอื่น (คุณมองไม่เห็นของตัวเอง)</p>
          <div className="bluff-others-grid">
            {players.map((p, i) => (
              <div key={p.id} className={`bluff-other ${i === currentIndex ? 'bluff-other--self' : ''}`}>
                {i === currentIndex ? (
                  <PlayingCard card={null} hidden size="sm" label="??? (คุณ)" />
                ) : (
                  <PlayingCard card={p.card} size="sm" label={p.name} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bluff-actions">
        <button type="button" className="btn btn--secondary btn--full" onClick={onKeep}>
          เก็บไพ่
        </button>
        {canSwap && (
          <button type="button" className="btn btn--primary btn--full" onClick={onSwap}>
            จั่วไพ่ใหม่ (ครั้งเดียว)
          </button>
        )}
      </div>
    </section>
  );
}
