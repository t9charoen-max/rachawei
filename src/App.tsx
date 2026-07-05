import { useGameState } from './game/useGameState';
import { SetupScreen } from './components/SetupScreen';
import { DealingScreen } from './components/DealingScreen';
import { BluffScreen } from './components/BluffScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { RevealScreen } from './components/RevealScreen';
import { PunishmentScreen } from './components/PunishmentScreen';
import { ResultScreen } from './components/ResultScreen';
import './App.css';

function HomeScreen({ onStart, onHowToPlay }: { onStart: () => void; onHowToPlay: () => void }) {
  return (
    <section className="screen home-screen">
      <div className="home-hero">
        <div className="home-crown" aria-hidden>
          👑
        </div>
        <h1 className="home-title">ราชาหวาย</h1>
        <p className="home-tagline">เกมไพ่ปาร์ตี้ — บลัฟเพื่อครองบัลลังก์</p>
      </div>

      <div className="home-weave" aria-hidden />

      <div className="home-actions">
        <button type="button" className="btn btn--primary btn--full btn--lg" onClick={onStart}>
          เริ่มเล่น
        </button>
        <button type="button" className="btn btn--ghost btn--full" onClick={onHowToPlay}>
          วิธีเล่น
        </button>
      </div>
    </section>
  );
}

function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  const rules = [
    'เพิ่มผู้เล่น 3–10 คน แล้วแจกไพ่คนละ 1 ใบ',
    'แปะไพ่บนหน้าผากหงายหน้า — อย่ามองไพ่ตัวเอง',
    'ทุกคนเห็นไพ่ของคนอื่น แต่ไม่เห็นไพ่ตัวเอง',
    'รอบบลัฟ: ผลัดกันตัดสินใจเก็บไพ่หรือจั่วใหม่ (จั่วได้ครั้งเดียว)',
    'นับถอยหลัง 3-2-1 แล้วเปิดไพ่ทุกคน',
    'ไพ่สูงสุดเป็น ราชาหวาย 👑 ไพ่ต่ำสุดเป็น กบฎ ⚔️',
    'ราชาเลือกโทษให้กบฎ — แล้วเล่นรอบใหม่!',
  ];

  return (
    <section className="screen howto-screen">
      <header className="screen-header">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← กลับ
        </button>
        <h2>วิธีเล่น</h2>
      </header>

      <ol className="rules-list">
        {rules.map((rule, i) => (
          <li key={i} className="rules-list__item">
            <span className="rules-list__num">{i + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>

      <div className="info-box">
        <p>
          <strong>การจัดอันดับไพ่:</strong> A &gt; K &gt; Q &gt; J &gt; 10 &gt; ... &gt; 2
          <br />
          ถ้าแต้มเท่ากัน: โพดำ &gt; ข้าวหลามตัด &gt; ดอกจิก &gt; โพแดง
        </p>
      </div>
    </section>
  );
}

export default function App() {
  const game = useGameState();
  const { state, goTo, addPlayer, removePlayer, startGame, finishDealing, keepCard, swapCard, tickCountdown, determineRoles, selectPunishment, resetGame, playAgain } = game;

  return (
    <div className="app">
      <div className="app-bg" aria-hidden />

      {state.phase === 'home' && (
        <HomeScreen onStart={() => goTo('setup')} onHowToPlay={() => goTo('howto')} />
      )}

      {state.phase === 'howto' && <HowToPlayScreen onBack={() => goTo('home')} />}

      {state.phase === 'setup' && (
        <SetupScreen
          players={state.players}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onStart={startGame}
          onBack={() => goTo('home')}
        />
      )}

      {state.phase === 'dealing' && (
        <DealingScreen players={state.players} onContinue={finishDealing} />
      )}

      {state.phase === 'bluff' && (
        <BluffScreen
          players={state.players}
          currentIndex={state.currentPlayerIndex}
          onKeep={keepCard}
          onSwap={swapCard}
        />
      )}

      {state.phase === 'countdown' && (
        <CountdownScreen countdown={state.countdown} onTick={tickCountdown} />
      )}

      {state.phase === 'reveal' && (
        <RevealScreen players={state.players} onContinue={determineRoles} />
      )}

      {state.phase === 'punishment' && (
        <PunishmentScreen
          players={state.players}
          kingId={state.kingId}
          traitorId={state.traitorId}
          onSelect={selectPunishment}
        />
      )}

      {state.phase === 'result' && (
        <ResultScreen
          players={state.players}
          kingId={state.kingId}
          traitorId={state.traitorId}
          punishment={state.selectedPunishment}
          onPlayAgain={playAgain}
          onHome={resetGame}
        />
      )}
    </div>
  );
}
