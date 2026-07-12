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
    <div className="mb-6 rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500 text-2xl text-white shadow">
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-violet-900">ค้นหาด้วยภาพ AI</h3>
          <p className="text-sm text-violet-700/80">ถ่ายรูปวัสดุ → AI หาสินค้าใกล้เคียงให้</p>
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
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? 'กำลังวิเคราะห์...' : '📷 ถ่าย/อัปโหลด'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-violet-200 px-3 py-2.5 text-sm text-violet-700 hover:bg-white"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {(preview || message) && (
        <div className="mt-3 flex items-center gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover ring-2 ring-violet-200" />
          )}
          {message && <p className="text-sm font-medium text-violet-800">{message}</p>}
        </div>
      )}
    </div>
  );
}
