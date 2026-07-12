import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QuoteRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    note?: string;
  }>;
  total_estimate: number;
  created_at: string;
};

function formatMessage(quote: QuoteRow) {
  const lines = quote.items.map(
    (item, index) =>
      `${index + 1}. ${item.product_name}\n   ${item.quantity} ${item.unit} × ฿${Number(item.unit_price).toLocaleString('th-TH')}${item.note ? `\n   หมายเหตุ: ${item.note}` : ''}`,
  );

  return [
    '📋 ใบขอราคาใหม่ — ราชาวัสดุ',
    '',
    `👤 ${quote.customer_name}`,
    `📞 ${quote.phone}`,
    quote.address ? `📍 ${quote.address}` : null,
    quote.note ? `📝 ${quote.note}` : null,
    '',
    '🛒 รายการ:',
    ...lines,
    '',
    `💰 ประมาณการ: ฿${Number(quote.total_estimate).toLocaleString('th-TH')}`,
    `🕐 ${new Date(quote.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
  ]
    .filter(Boolean)
    .join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quote_id } = (await req.json()) as { quote_id?: string };
    if (!quote_id) {
      return new Response(JSON.stringify({ error: 'quote_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lineToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')?.trim();
    const lineUserId = Deno.env.get('LINE_ADMIN_USER_ID')?.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

    if (!lineToken || !lineUserId) {
      return new Response(JSON.stringify({ error: 'LINE not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl!, serviceKey!);
    const { data: quote, error } = await admin
      .from('quote_requests')
      .select('*')
      .eq('id', quote_id)
      .single();

    if (error || !quote) {
      return new Response(JSON.stringify({ error: 'quote not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: formatMessage(quote as QuoteRow) }],
      }),
    });

    if (!lineRes.ok) {
      const body = await lineRes.text();
      return new Response(JSON.stringify({ error: body }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
