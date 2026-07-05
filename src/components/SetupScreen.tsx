import { useState } from 'react';

interface SetupScreenProps {
  players: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export function SetupScreen({ players, onAdd, onRemove, onStart, onBack }: SetupScreenProps) {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim() && players.length < 10) {
      onAdd(name);
      setName('');
    }
  };

  return (
    <section className="screen setup-screen">
      <header className="screen-header">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← กลับ
        </button>
        <h2>เพิ่มผู้เล่น</h2>
        <p className="screen-subtitle">ต้องมีอย่างน้อย 3 คน สูงสุด 10 คน</p>
      </header>

      <div className="setup-input">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ชื่อผู้เล่น"
          maxLength={20}
          className="input"
        />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleAdd}
          disabled={!name.trim() || players.length >= 10}
        >
          เพิ่ม
        </button>
      </div>

      <ul className="player-list">
        {players.map((p, i) => (
          <li key={p.id} className="player-list__item">
            <span className="player-list__index">{i + 1}</span>
            <span className="player-list__name">{p.name}</span>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => onRemove(p.id)}
              aria-label={`ลบ ${p.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {players.length === 0 && (
        <p className="empty-hint">ยังไม่มีผู้เล่น — เพิ่มชื่อเพื่อนๆ ของคุณ</p>
      )}

      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={onStart}
        disabled={players.length < 3}
      >
        เริ่มเกม ({players.length} คน)
      </button>
    </section>
  );
}
