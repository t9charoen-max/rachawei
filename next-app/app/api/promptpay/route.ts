import { NextResponse } from 'next/server';
import { createPromptPayQr } from '@/lib/promptpay';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amount?: number; promptPayId?: string };
    const result = await createPromptPayQr({
      amount: body.amount,
      promptPayId: body.promptPayId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'สร้าง QR ไม่สำเร็จ';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get('amount'));

  try {
    const result = await createPromptPayQr({
      amount: Number.isNaN(amount) ? undefined : amount,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'สร้าง QR ไม่สำเร็จ';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
