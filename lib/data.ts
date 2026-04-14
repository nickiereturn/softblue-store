import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product
} from "@/types";

const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");

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
  createdAt?: unknown;
};

type StoredOrder = Omit<Order, "paymentSlip" | "paymentStatus" | "status" | "createdAt"> & {
  paymentSlip?: string;
  paymentStatus?: string;
  promptPaySlipUrl?: string;
  status?: string;
  createdAt?: unknown;
};

type OrderInput = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentSlip?: string;
  items: Array<{ productId: string; quantity: number }>;
};

function normalizeCreatedAt(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return new Date().toISOString();
}

function normalizeProduct(
  input: ProductInput,
  options?: {
    existingId?: string;
    existingProduct?: Product | null;
  }
): Product {
  const primaryImage = input.image || input.images?.[0] || "";
  const images =
    Array.isArray(input.images) && input.images.length > 0
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
      normalizeCreatedAt(input.createdAt) ||
      options?.existingProduct?.createdAt ||
      new Date().toISOString()
  };
}

function normalizeOrderStatus(status?: string): OrderStatus {
  return status === "shipped" ? "shipped" : "pending";
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

function normalizeOrder(order: StoredOrder): Order {
  return {
    ...order,
    paymentSlip: order.paymentSlip || order.promptPaySlipUrl || "",
    paymentStatus: normalizePaymentStatus(
      order.paymentMethod,
      order.paymentStatus
    ),
    createdAt: normalizeCreatedAt(order.createdAt),
    status: normalizeOrderStatus(order.status)
  };
}

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);
  const products = snapshot.docs.map((entry) =>
    normalizeProduct(entry.data() as ProductInput, {
      existingId: entry.id,
      existingProduct: null
    })
  );

  return products.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

export async function getProductById(id: string) {
  const snapshot = await getDoc(doc(db, "products", id));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeProduct(snapshot.data() as ProductInput, {
    existingId: snapshot.id,
    existingProduct: null
  });
}

export async function saveProduct(input: ProductInput) {
  if (input.id) {
    const existingProduct = await getProductById(input.id);
    const product = normalizeProduct(input, {
      existingId: input.id,
      existingProduct
    });

    await updateDoc(doc(db, "products", input.id), {
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      image: product.image,
      images: product.images,
      youtubeUrl: product.youtubeUrl,
      isBestSeller: product.isBestSeller,
      createdAt: product.createdAt
    });

    return product;
  }

  const product = normalizeProduct(input);
  const created = await addDoc(productsCollection, {
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    image: product.image,
    images: product.images,
    youtubeUrl: product.youtubeUrl,
    isBestSeller: product.isBestSeller,
    createdAt: product.createdAt
  });

  return {
    ...product,
    id: created.id
  };
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}

export async function getOrders() {
  const snapshot = await getDocs(ordersCollection);
  const orders = snapshot.docs.map((entry) =>
    normalizeOrder({
      id: entry.id,
      ...(entry.data() as Omit<StoredOrder, "id">)
    })
  );

  return orders.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

export async function createOrder(input: OrderInput) {
  const products = await Promise.all(
    input.items.map(async (item) => {
      const product = await getProductById(item.productId);
      return { item, product };
    })
  );

  const items: OrderItem[] = products.map(({ item, product }) => {
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

  for (const { item, product } of products) {
    if (!product) {
      continue;
    }

    await updateDoc(doc(db, "products", product.id), {
      stock: product.stock - item.quantity
    });
  }

  const order: Omit<Order, "id"> = {
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

  const created = await addDoc(ordersCollection, {
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    paymentMethod: order.paymentMethod,
    paymentSlip: order.paymentSlip,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: new Date(order.createdAt),
    items: order.items,
    status: order.status
  });

  return {
    id: created.id,
    ...order
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const nextStatus = normalizeOrderStatus(status);
  await updateDoc(doc(db, "orders", orderId), { status: nextStatus });

  const order = await getDoc(doc(db, "orders", orderId));

  if (!order.exists()) {
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  return normalizeOrder({
    id: order.id,
    ...(order.data() as Omit<StoredOrder, "id">)
  });
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
) {
  const nextPaymentStatus =
    paymentStatus === "confirmed" ? "confirmed" : "pending";

  await updateDoc(doc(db, "orders", orderId), {
    paymentStatus: nextPaymentStatus
  });

  const order = await getDoc(doc(db, "orders", orderId));

  if (!order.exists()) {
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  return normalizeOrder({
    id: order.id,
    ...(order.data() as Omit<StoredOrder, "id">)
  });
}
