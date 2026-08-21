'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
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
      <div className="flex min-h-dvh items-center justify-center text-amber-100/70">กำลังโหลด...</div>
    );
  }

  if (!authed) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
        <div className="light-orb left-[-10%] top-[-10%] h-72 w-72 bg-amber-500/30" />
        <div className="light-orb right-[-5%] bottom-[-10%] h-64 w-64 bg-yellow-500/20" />

        <form
          onSubmit={handleSubmit}
          className="glass-panel gold-frame relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center gap-3">
            <Image src={BRAND.logoPath} alt="" width={48} height={48} className="rounded-xl" />
            <div>
              <p className="text-[11px] tracking-wide text-amber-300/80 uppercase">หลังบ้าน</p>
              <h1 className="font-display text-xl font-semibold gold-text">{BRAND.shopName}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-amber-100/65">ระบบจัดการร้านวัสดุก่อสร้าง</p>

          <label className="mt-6 block text-sm text-amber-100/80" htmlFor="admin-pin">
            รหัสผ่าน / PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-amber-400/30 bg-[#0a1628]/80 px-3 py-3 text-amber-50 outline-none placeholder:text-amber-100/35 focus:ring-2 focus:ring-amber-400/40"
            placeholder="กรอกรหัส"
          />

          <p className="mt-2 text-xs text-amber-200/70">รหัสทดสอบ: 1234</p>
          {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="btn-shine mt-5 w-full rounded-xl bg-gold-gradient px-4 py-3 text-sm font-bold text-[#0a1628] shadow-[0_8px_24px_rgba(212,175,55,0.4)]"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
