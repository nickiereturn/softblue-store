import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function formatPaymentMethod(method: PaymentMethod) {
  if (method === "promptpay") {
    return "PromptPay";
  }

  return "เก็บเงินปลายทาง";
}

export function formatPaymentStatus(status: PaymentStatus) {
  if (status === "confirmed") {
    return "ยืนยันแล้ว";
  }

  return "รอตรวจสอบ";
}

export function formatOrderStatus(status: OrderStatus) {
  if (status === "shipped") {
    return "จัดส่งแล้ว";
  }

  return "รอดำเนินการ";
}
