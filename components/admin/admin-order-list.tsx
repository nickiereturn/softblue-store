"use client";

import { useEffect, useState } from "react";

import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus
} from "@/lib/format";
import { Order, OrderStatus } from "@/types";

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "รอดำเนินการ" },
  { value: "shipped", label: "จัดส่งแล้ว" }
];

function getOrderCardStyle(status: OrderStatus) {
  if (status === "shipped") {
    return { background: "#E6F7EC" };
  }

  return { background: "#FFF4E5" };
}

function getPaymentStatusStyle(paymentStatus: Order["paymentStatus"]) {
  if (paymentStatus === "confirmed") {
    return {
      background: "#E6F7EC",
      color: "#1F6B3B"
    };
  }

  return {
    background: "#FFF4E5",
    color: "#9A5B00"
  };
}

export function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [savingOrderId, setSavingOrderId] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((response) => response.json())
      .then((data) => setOrders(data.orders || []));
  }, []);

  async function updateOrder(orderId: string, body: Record<string, string>) {
    const response = await fetch("/api/orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId,
        ...body
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "ไม่สามารถอัปเดตข้อมูลได้");
    }

    return payload.order as Order;
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const previousOrders = orders;

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
    setSavingOrderId(orderId);

    try {
      const updatedOrder = await updateOrder(orderId, { status });
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? updatedOrder : order
        )
      );
    } catch (error) {
      setOrders(previousOrders);
      window.alert(
        error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะได้"
      );
    } finally {
      setSavingOrderId("");
    }
  }

  async function handlePaymentConfirm(orderId: string) {
    const previousOrders = orders;

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, paymentStatus: "confirmed" }
          : order
      )
    );
    setSavingOrderId(orderId);

    try {
      const updatedOrder = await updateOrder(orderId, {
        paymentStatus: "confirmed"
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? updatedOrder : order
        )
      );
    } catch (error) {
      setOrders(previousOrders);
      window.alert(
        error instanceof Error ? error.message : "ไม่สามารถยืนยันการชำระเงินได้"
      );
    } finally {
      setSavingOrderId("");
    }
  }

  return (
    <section className="section-card">
      <h1>คำสั่งซื้อ</h1>
      {orders.length === 0 ? (
        <p>ยังไม่มีคำสั่งซื้อ</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article
              key={order.id}
              className="order-card"
              style={getOrderCardStyle(order.status)}
            >
              <div className="order-card-head" style={{ alignItems: "start" }}>
                <div>
                  <strong>{order.customerName}</strong>
                  <div className="muted-text">{order.phone}</div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    justifyItems: "end"
                  }}
                >
                  <div className="order-status">
                    {formatOrderStatus(order.status)}
                  </div>
                  <select
                    value={order.status}
                    onChange={(event) =>
                      handleStatusChange(
                        order.id,
                        event.target.value as OrderStatus
                      )
                    }
                    disabled={savingOrderId === order.id}
                    style={{
                      minHeight: 36,
                      minWidth: 132,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      background: "white"
                    }}
                    aria-label="สถานะคำสั่งซื้อ"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="muted-text">{formatDate(order.createdAt)}</div>
              <div className="muted-text">เลขที่คำสั่งซื้อ: {order.id}</div>
              <div className="muted-text">
                การชำระเงิน: {formatPaymentMethod(order.paymentMethod)}
              </div>
              <div className="muted-text">ที่อยู่: {order.address}</div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 12
                }}
              >
                <span className="muted-text">สถานะการชำระเงิน:</span>
                <span
                  style={{
                    ...getPaymentStatusStyle(order.paymentStatus),
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  {formatPaymentStatus(order.paymentStatus)}
                </span>
              </div>

              {order.paymentSlip ? (
                <a
                  href={order.paymentSlip}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 14
                  }}
                >
                  <img
                    src={order.paymentSlip}
                    alt="สลิปการโอนเงิน"
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "white"
                    }}
                  />
                </a>
              ) : null}

              {order.paymentMethod === "promptpay" ? (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={
                      order.paymentStatus === "confirmed" ||
                      savingOrderId === order.id
                    }
                    onClick={() => handlePaymentConfirm(order.id)}
                  >
                    {order.paymentStatus === "confirmed"
                      ? "ยืนยันการชำระเงินแล้ว"
                      : "ยืนยันการชำระเงิน"}
                  </button>
                </div>
              ) : null}

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="order-item-row">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-row">
                <span>รวมทั้งหมด</span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
