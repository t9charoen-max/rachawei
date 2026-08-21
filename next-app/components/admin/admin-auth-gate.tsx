'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { isAdminAuthed, loginAdmin } from '@/lib/materials/admin-store';
import { BRAND } from '@/lib/materials/brand';

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthed(isAdminAuthed());
    setReady(true);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = loginAdmin(password);
    if (!ok) {
      setError('รหัสไม่ถูกต้อง ลอง 1234 หรือ admin');
      return;
    }
    setError('');
    setAuthed(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-blue-100/80">
        กำลังโหลด...
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
        <div className="light-orb left-[-10%] top-[-10%] h-72 w-72 bg-blue-600/40" />
        <div className="light-orb right-[-5%] bottom-[-10%] h-64 w-64 bg-cyan-500/30" />

        <form
          onSubmit={handleSubmit}
          className="glass-panel relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          <p className="text-xs tracking-wide text-cyan-300/90 uppercase">Admin Login</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{BRAND.shopName}</h1>
          <p className="mt-1 text-sm text-blue-100/70">เข้าสู่ระบบจัดการวัสดุ</p>

          <label className="mt-6 block text-sm text-blue-100/90" htmlFor="admin-pin">
            รหัสผ่าน / PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-blue-400/30 bg-[#0a1628]/80 px-3 py-2.5 text-white outline-none ring-cyan-400/40 placeholder:text-blue-200/40 focus:ring-2"
            placeholder="กรอกรหัส"
          />

          <p className="mt-2 text-xs text-cyan-200/80">รหัสทดสอบ: 1234</p>
          {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.45)] transition hover:bg-blue-500"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
