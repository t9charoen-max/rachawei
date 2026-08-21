export type StockStatus = 'พร้อมส่ง' | 'เหลือน้อย';

export type MaterialProduct = {
  id: string;
  name: string;
  category: string;
  spec: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  stock_status: StockStatus;
  image_url: string;
  is_active: boolean;
};

export type QuoteItemInput = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  note?: string;
};

export type QuoteRequestPayload = {
  customer_name: string;
  phone: string;
  address?: string;
  note?: string;
  items: QuoteItemInput[];
};
