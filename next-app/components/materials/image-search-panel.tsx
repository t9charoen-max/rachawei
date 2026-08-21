'use client';

import { useRef, useState } from 'react';
import type { MaterialProduct } from '@/types/material';
import { analyzeImageForProducts } from '@/lib/materials/image-search';

type Props = {
  products: MaterialProduct[];
  onResults: (matches: MaterialProduct[]) => void;
  onClear: () => void;
};

export function ImageSearchPanel({ products, onResults, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setMessage(null);
    setPreview(URL.createObjectURL(file));

    try {
      await new Promise((r) => setTimeout(r, 600));
      const { matches, confidence } = await analyzeImageForProducts(file, products);
      onResults(matches);

      const labels = { high: 'พบสินค้าที่ใกล้เคียง', medium: 'อาจใกล้เคียง', low: 'ลองดูแนะนำ' };
      setMessage(`🤖 AI ${labels[confidence]} — ${matches.length} รายการ`);
    } catch {
      setMessage('วิเคราะห์ภาพไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setMessage(null);
    onClear();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="glass-panel light-sweep relative mb-6 overflow-hidden rounded-2xl border-dashed border-sky-500/35 p-4">
      <div className="light-orb -right-6 -top-6 h-24 w-24 bg-sky-400/25" />
      <div className="relative flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-2xl text-white shadow shadow-blue-500/30">
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sky-100">ค้นหาด้วยภาพ AI</h3>
          <p className="text-sm text-slate-400">ถ่ายรูปวัสดุ → AI หาสินค้าใกล้เคียงให้</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="btn-shine rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'กำลังวิเคราะห์...' : '📷 ถ่าย/อัปโหลด'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-sky-500/30 px-3 py-2.5 text-sm text-sky-300 hover:bg-sky-500/10"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {(preview || message) && (
        <div className="relative mt-3 flex items-center gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-14 w-14 rounded-lg object-cover ring-2 ring-sky-400/40"
            />
          )}
          {message && <p className="text-sm font-medium text-cyan-200">{message}</p>}
        </div>
      )}
    </div>
  );
}
