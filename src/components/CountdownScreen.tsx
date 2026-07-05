import { useEffect } from 'react';

interface CountdownScreenProps {
  countdown: number;
  onTick: () => void;
}

export function CountdownScreen({ countdown, onTick }: CountdownScreenProps) {
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(onTick, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onTick]);

  if (countdown <= 0) return null;

  return (
    <section className="screen countdown-screen">
      <h2 className="countdown-title">เปิดไพ่!</h2>
      <div className="countdown-number" key={countdown}>
        {countdown}
      </div>
      <p className="countdown-hint">เตรียมตัวเปิดไพ่บนหัวทุกคน</p>
    </section>
  );
}
