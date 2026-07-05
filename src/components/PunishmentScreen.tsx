import { PUNISHMENTS } from '../game/cards';
import type { Player } from '../game/types';

interface PunishmentScreenProps {
  players: Player[];
  kingId: string | null;
  traitorId: string | null;
  onSelect: (punishment: string) => void;
}

export function PunishmentScreen({ players, kingId, traitorId, onSelect }: PunishmentScreenProps) {
  const king = players.find((p) => p.id === kingId);
  const traitor = players.find((p) => p.id === traitorId);

  return (
    <section className="screen punishment-screen">
      <header className="screen-header">
        <h2>ราชาลงโทษกบฎ</h2>
        <p className="screen-subtitle">
          <strong>{king?.name}</strong> เป็นพระราชา — เลือกโทษให้ <strong>{traitor?.name}</strong>
        </p>
      </header>

      <div className="role-cards">
        <div className="role-card role-card--king">
          <span className="role-card__icon">👑</span>
          <span className="role-card__title">ราชาหวาย</span>
          <span className="role-card__name">{king?.name}</span>
        </div>
        <div className="role-card role-card--traitor">
          <span className="role-card__icon">⚔️</span>
          <span className="role-card__title">กบฎ</span>
          <span className="role-card__name">{traitor?.name}</span>
        </div>
      </div>

      <p className="punishment-prompt">เลือกโทษ (หรือสร้างโทษเองก็ได้)</p>

      <div className="punishment-grid">
        {PUNISHMENTS.map((p) => (
          <button
            key={p}
            type="button"
            className="punishment-btn"
            onClick={() => onSelect(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </section>
  );
}
