import { PaymentMethod } from "@/types";

export const paymentOptions: Array<{ id: PaymentMethod; label: string }> = [
  { id: "promptpay", label: "พร้อมเพย์" },
  { id: "card", label: "บัตรเครดิต (Visa)" },
  { id: "cod", label: "เก็บเงินปลายทาง" }
];

export const contactLinks = {
  line: process.env.NEXT_PUBLIC_LINE_URL || "https://line.me/R/ti/p/@yourstore",
  messenger:
    process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/yourstore"
};
