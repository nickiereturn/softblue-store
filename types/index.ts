export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  images: string[];
  youtubeUrl?: string;
  isBestSeller: boolean;
  createdAt: string;
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

export type PaymentMethod = "promptpay" | "cod";
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
  total: number;
  createdAt: string;
  items: OrderItem[];
  status: OrderStatus;
};
