import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

type PromptPayOptions = {
  amount?: number;
  promptPayId?: string;
};

export async function createPromptPayQr({ amount, promptPayId }: PromptPayOptions) {
  const targetId = promptPayId ?? process.env.PROMPTPAY_ID ?? '0814707089';

  if (!targetId) {
    throw new Error('ไม่พบหมายเลข PromptPay');
  }

  if (amount !== undefined && (Number.isNaN(amount) || amount <= 0)) {
    throw new Error('จำนวนเงินไม่ถูกต้อง');
  }

  const payload = generatePayload(targetId, amount !== undefined ? { amount } : {});
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });

  return {
    payload,
    dataUrl,
    promptPayId: targetId,
    amount: amount ?? null,
  };
}
