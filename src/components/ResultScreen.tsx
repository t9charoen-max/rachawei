import type { Player } from '../game/types';

interface ResultScreenProps {
  players: Player[];
  kingId: string | null;
  traitorId: string | null;
  punishment: string | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultScreen({
  players,
  kingId,
  traitorId,
  punishment,
  onPlayAgain,
  onHome,
}: ResultScreenProps) {
  const king = players.find((p) => p.id === kingId);
  const traitor = players.find((p) => p.id === traitorId);

  return (
    <section className="screen result-screen">
      <div className="result-celebration">
        <span className="result-crown">👑</span>
        <h2>จบรอบ!</h2>
      </div>

      <div className="result-summary">
        <p>
          <strong>{king?.name}</strong> ครองบัลลังก์ราชาหวาย
        </p>
        <p>
          <strong>{traitor?.name}</strong> คือกบฎที่ต้องรับโทษ
        </p>
        {punishment && (
          <div className="result-punishment">
            <span className="result-punishment__label">โทษ</span>
            <span className="result-punishment__text">{punishment}</span>
          </div>
        )}
      </div>

      <div className="result-actions">
        <button type="button" className="btn btn--primary btn--full" onClick={onPlayAgain}>
          เล่นอีกรอบ
        </button>
        <button type="button" className="btn btn--ghost btn--full" onClick={onHome}>
          กลับหน้าแรก
        </button>
      </div>
    </section>
  );
}
