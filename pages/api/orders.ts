import type { NextApiRequest, NextApiResponse } from "next";

import { isAdminApiRequest } from "@/lib/auth";
import {
  createOrder,
  getOrders,
  updateOrderPaymentStatus,
  updateOrderStatus
} from "@/lib/data";
import { Order, OrderStatus, PaymentStatus } from "@/types";

function isValidStatus(status: unknown): status is OrderStatus {
  return status === "pending" || status === "shipped";
}

function isValidPaymentStatus(status: unknown): status is PaymentStatus {
  return status === "pending" || status === "confirmed";
}

async function sendLineOrderNotification(order: Order) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!accessToken || !userId) {
    return;
  }

  const itemNames = order.items.map((item) => item.name).join(", ");

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text: `🛒 มีออเดอร์ใหม่!

ชื่อ: ${order.customerName}
เบอร์: ${order.phone}
ยอดรวม: ${order.total} บาท
สินค้า: ${itemNames}`
        }
      ]
    })
  });
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "GET") {
    if (!isAdminApiRequest(request)) {
      return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }

    const orders = await getOrders();
    return response.status(200).json({ orders });
  }

  if (request.method === "POST") {
    const body = request.body || {};

    if (
      !body.customerName ||
      !body.phone ||
      !body.address ||
      !body.paymentMethod ||
      !Array.isArray(body.items)
    ) {
      return response.status(400).json({ error: "กรอกข้อมูลไม่ครบถ้วน" });
    }

    try {
      const order = await createOrder(body);

      try {
        await sendLineOrderNotification(order);
      } catch (lineError) {
        console.error("LINE notification failed", lineError);
      }

      return response.status(200).json({ order });
    } catch (error) {
      return response.status(400).json({
        error:
          error instanceof Error ? error.message : "ไม่สามารถสร้างคำสั่งซื้อได้"
      });
    }
  }

  if (request.method === "PUT") {
    if (!isAdminApiRequest(request)) {
      return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }

    const { orderId, status, paymentStatus } = request.body || {};

    if (!orderId) {
      return response.status(400).json({ error: "ไม่พบคำสั่งซื้อ" });
    }

    try {
      if (isValidStatus(status)) {
        const order = await updateOrderStatus(orderId, status);
        return response.status(200).json({ order });
      }

      if (isValidPaymentStatus(paymentStatus)) {
        const order = await updateOrderPaymentStatus(orderId, paymentStatus);
        return response.status(200).json({ order });
      }

      return response.status(400).json({ error: "ข้อมูลสถานะไม่ถูกต้อง" });
    } catch (error) {
      return response.status(400).json({
        error:
          error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะได้"
      });
    }
  }

  response.setHeader("Allow", "GET, POST, PUT");
  return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
}
