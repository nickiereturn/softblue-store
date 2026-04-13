import { promises as fs } from "fs";
import path from "path";

import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product
} from "@/types";

const dataDir = path.join(process.cwd(), "data");
const productFile = path.join(dataDir, "products.json");
const orderFile = path.join(dataDir, "orders.json");

async function ensureDataFile(filePath: string, fallback: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, fallback, "utf8");
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataFile(filePath, JSON.stringify(fallback, null, 2));
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await ensureDataFile(filePath, JSON.stringify(value, null, 2));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

type StoredProduct = Omit<Product, "image" | "images" | "isBestSeller" | "createdAt"> & {
  image?: string;
  images?: string[];
  isBestSeller?: boolean;
  createdAt?: string;
};

type ProductInput = {
  id?: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  images?: string[];
  youtubeUrl?: string;
  isBestSeller?: boolean;
  createdAt?: string;
};

function normalizeProduct(
  input: ProductInput,
  options?: {
    existingId?: string;
    existingProduct?: Product | null;
  }
): Product {
  const primaryImage = input.image || input.images?.[0] || "";
  const images =
    input.images && input.images.length > 0
      ? input.images
      : primaryImage
        ? [primaryImage]
        : [];

  return {
    id: options?.existingId || input.id || crypto.randomUUID(),
    name: input.name,
    price: Number(input.price),
    stock: Number(input.stock),
    description: input.description,
    image: primaryImage,
    images,
    youtubeUrl: input.youtubeUrl || "",
    isBestSeller:
      typeof input.isBestSeller === "boolean"
        ? input.isBestSeller
        : options?.existingProduct?.isBestSeller || false,
    createdAt:
      input.createdAt ||
      options?.existingProduct?.createdAt ||
      new Date().toISOString()
  };
}

function normalizeStoredProduct(product: StoredProduct): Product {
  return normalizeProduct(product, {
    existingId: product.id,
    existingProduct: null
  });
}

export async function getProducts() {
  const products = await readJsonFile<StoredProduct[]>(productFile, []);
  return products.map(normalizeStoredProduct);
}

export async function getProductById(id: string) {
  const products = await getProducts();
  return products.find((product) => product.id === id) || null;
}

export async function saveProduct(input: ProductInput) {
  const products = await getProducts();
  const index = input.id
    ? products.findIndex((product) => product.id === input.id)
    : -1;
  const existingProduct = index >= 0 ? products[index] : null;
  const product = normalizeProduct(input, {
    existingId: existingProduct?.id,
    existingProduct
  });

  if (index >= 0) {
    products[index] = product;
  } else {
    products.unshift(product);
  }

  await writeJsonFile(productFile, products);
  return product;
}

export async function deleteProduct(id: string) {
  const products = await getProducts();
  const nextProducts = products.filter((product) => product.id !== id);
  await writeJsonFile(productFile, nextProducts);
}

function normalizeOrderStatus(status?: string): OrderStatus {
  if (status === "shipped") {
    return "shipped";
  }

  return "pending";
}

function normalizePaymentStatus(
  paymentMethod: PaymentMethod,
  paymentStatus?: string
): PaymentStatus {
  if (paymentStatus === "confirmed") {
    return "confirmed";
  }

  if (paymentStatus === "pending") {
    return "pending";
  }

  return paymentMethod === "promptpay" ? "pending" : "confirmed";
}

type StoredOrder = Omit<Order, "paymentSlip" | "paymentStatus" | "status"> & {
  paymentSlip?: string;
  paymentStatus?: string;
  promptPaySlipUrl?: string;
  status?: string;
};

function normalizeOrder(order: StoredOrder): Order {
  return {
    ...order,
    paymentSlip: order.paymentSlip || order.promptPaySlipUrl || "",
    paymentStatus: normalizePaymentStatus(
      order.paymentMethod,
      order.paymentStatus
    ),
    status: normalizeOrderStatus(order.status)
  };
}

export async function getOrders() {
  const orders = await readJsonFile<StoredOrder[]>(orderFile, []);
  return orders.map(normalizeOrder);
}

type OrderInput = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentSlip?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export async function createOrder(input: OrderInput) {
  const products = await getProducts();
  const orders = await getOrders();

  const items: OrderItem[] = input.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new Error("ไม่พบสินค้า");
    }

    if (item.quantity < 1) {
      throw new Error("จำนวนสินค้าต้องไม่น้อยกว่า 1");
    }

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} สินค้าไม่เพียงพอ`);
    }

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image || product.images[0] || ""
    };
  });

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const nextProducts = products.map((product) => {
    const orderItem = items.find((item) => item.productId === product.id);

    if (!orderItem) {
      return product;
    }

    return {
      ...product,
      stock: product.stock - orderItem.quantity
    };
  });

  const order: Order = {
    id: crypto.randomUUID(),
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    paymentMethod: input.paymentMethod,
    paymentSlip: input.paymentSlip || "",
    paymentStatus:
      input.paymentMethod === "promptpay" ? "pending" : "confirmed",
    total,
    createdAt: new Date().toISOString(),
    items,
    status: "pending"
  };

  orders.unshift(order);
  await writeJsonFile(productFile, nextProducts);
  await writeJsonFile(orderFile, orders);

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = await getOrders();
  const index = orders.findIndex((order) => order.id === orderId);

  if (index < 0) {
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  orders[index] = {
    ...orders[index],
    status: normalizeOrderStatus(status)
  };

  await writeJsonFile(orderFile, orders);
  return orders[index];
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
) {
  const orders = await getOrders();
  const index = orders.findIndex((order) => order.id === orderId);

  if (index < 0) {
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  orders[index] = {
    ...orders[index],
    paymentStatus
  };

  await writeJsonFile(orderFile, orders);
  return orders[index];
}
