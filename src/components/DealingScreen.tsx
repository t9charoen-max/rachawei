import type { Player } from '../game/types';
import { PlayingCard } from './PlayingCard';

interface DealingScreenProps {
  players: Player[];
  onContinue: () => void;
}

export function DealingScreen({ players, onContinue }: DealingScreenProps) {
  return (
    <section className="screen dealing-screen">
      <header className="screen-header">
        <h2>แจกไพ่แล้ว!</h2>
        <p className="screen-subtitle">
          ส่งมือถือให้เพื่อนดูไพ่บนหัวของคุณ — อย่ามองไพ่ตัวเอง
        </p>
      </header>

      <div className="dealing-grid">
        {players.map((player) => (
          <div key={player.id} className="dealing-player">
            <PlayingCard card={player.card} hidden label={player.name} />
            <p className="dealing-player__hint">ไพ่บนหัว {player.name}</p>
          </div>
        ))}
      </div>

      <div className="info-box">
        <p>ทุกคนเห็นไพ่ของคนอื่น แต่ไม่เห็นไพ่ตัวเอง — พร้อมแล้วกดปุ่มด้านล่าง</p>
      </div>

      <button type="button" className="btn btn--primary btn--full" onClick={onContinue}>
        เริ่มรอบบลัฟ
      </button>
    </section>
  );
}
