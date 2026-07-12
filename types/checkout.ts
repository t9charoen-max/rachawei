export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  fee: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CheckoutLine = {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  maxStock: number;
};

export type OrderSummary = {
  lines: CheckoutLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  deliveryZoneId: string;
  items: CartItem[];
};

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      summary: OrderSummary;
      zoneName: string;
    }
  | {
      success: false;
      error: string;
    };
