export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  images: string[];
  youtubeUrl?: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type PaymentMethod = "promptpay" | "card" | "cod";
export type PaymentStatus = "pending" | "confirmed";
export type OrderStatus = "pending" | "shipped";

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentSlip?: string;
  paymentStatus: PaymentStatus;
  cardLast4?: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  status: OrderStatus;
};
