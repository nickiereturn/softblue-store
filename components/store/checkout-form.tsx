"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/store/cart-context";
import { paymentOptions } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

type CheckoutState = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "promptpay" | "card" | "cod";
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  slipFile: File | null;
};

const initialState: CheckoutState = {
  customerName: "",
  phone: "",
  address: "",
  paymentMethod: "promptpay",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  slipFile: null
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

export function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowId = searchParams?.get("buyNow") || null;
  const { items, clearCart } = useCart();
  const [form, setForm] = useState(initialState);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    if (!buyNowId) {
      setBuyNowProduct(null);
      return;
    }

    fetch(`/api/products/${buyNowId}`)
      .then((response) => response.json())
      .then((data) => setBuyNowProduct(data.product || null));
  }, [buyNowId]);

  const orderItems = useMemo(() => {
    if (buyNowProduct) {
      return [{ productId: buyNowProduct.id, quantity: 1, product: buyNowProduct }];
    }

    return items
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: products.find((product) => product.id === item.productId) || null
      }))
      .filter((entry) => entry.product);
  }, [buyNowProduct, items, products]);

  const total = orderItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  async function uploadSlip() {
    if (!form.slipFile) {
      return "";
    }

    const dataUrl = await fileToDataUrl(form.slipFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category: "slip",
        fileName: form.slipFile.name,
        mimeType: form.slipFile.type,
        dataUrl
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "อัปโหลดสลิปไม่สำเร็จ");
    }

    return payload.url as string;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const confirmed = window.confirm("ยืนยันการสั่งซื้อใช่หรือไม่?");

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      if (orderItems.length === 0) {
        throw new Error("ยังไม่มีสินค้าในรายการสั่งซื้อ");
      }

      if (form.paymentMethod === "promptpay" && !form.slipFile) {
        throw new Error("กรุณาอัปโหลดสลิปการโอนเงิน");
      }

      if (
        form.paymentMethod === "card" &&
        form.cardNumber.replace(/\s/g, "").length < 12
      ) {
        throw new Error("กรุณากรอกหมายเลขบัตร Visa ให้ถูกต้อง");
      }

      const paymentSlip =
        form.paymentMethod === "promptpay" ? await uploadSlip() : "";

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          address: form.address,
          paymentMethod: form.paymentMethod,
          paymentSlip,
          cardNumber: form.cardNumber,
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "ทำรายการสั่งซื้อไม่สำเร็จ");
      }

      if (!buyNowId) {
        clearCart();
      }

      setForm(initialState);
      router.push(
        `/thank-you?orderId=${encodeURIComponent(
          payload.order.id
        )}&paymentMethod=${encodeURIComponent(form.paymentMethod)}`
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ไม่สามารถทำรายการสั่งซื้อได้"
      );
      setSubmitting(false);
    }
  }

  if (!buyNowId && items.length === 0) {
    return (
      <section className="section-card">
        <h1>ชำระเงิน</h1>
        <p>ยังไม่มีสินค้าในตะกร้า</p>
        <Link className="button button-primary" href="/">
          กลับไปร้านค้า
        </Link>
      </section>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="section-card checkout-form" onSubmit={handleSubmit}>
        <h1>ชำระเงิน</h1>

        <label className="field">
          <span>ชื่อผู้รับ</span>
          <input
            required
            value={form.customerName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                customerName: event.target.value
              }))
            }
          />
        </label>

        <label className="field">
          <span>เบอร์โทรศัพท์</span>
          <input
            required
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>ที่อยู่จัดส่ง</span>
          <textarea
            required
            rows={4}
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
          />
        </label>

        <div className="payment-choice-group">
          <span className="field-label">ช่องทางชำระเงิน</span>
          <div className="payment-choice-list">
            {paymentOptions.map((option) => (
              <label className="payment-choice" key={option.id}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={form.paymentMethod === option.id}
                  onChange={() =>
                    setForm((current) => ({ ...current, paymentMethod: option.id }))
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {form.paymentMethod === "promptpay" ? (
          <div className="payment-panel">
            <img
              src="/payments/promptpay-qr.svg"
              alt="คิวอาร์พร้อมเพย์"
              className="promptpay-image"
            />
            <p className="muted-text" style={{ marginTop: 0 }}>
              กรุณาโอนเงินตามยอดและแนบสลิป
            </p>
            <label className="field">
              <span>อัปโหลดสลิปการโอนเงิน</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slipFile: event.target.files?.[0] || null
                  }))
                }
              />
            </label>
          </div>
        ) : null}

        {form.paymentMethod === "card" ? (
          <div className="payment-panel">
            <label className="field">
              <span>ชื่อบนบัตร</span>
              <input
                required
                value={form.cardName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cardName: event.target.value
                  }))
                }
              />
            </label>
            <label className="field">
              <span>หมายเลขบัตร Visa</span>
              <input
                required
                value={form.cardNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cardNumber: event.target.value
                  }))
                }
              />
            </label>
            <div className="two-columns">
              <label className="field">
                <span>วันหมดอายุ</span>
                <input
                  required
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expiry: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  required
                  value={form.cvc}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cvc: event.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        ) : null}

        {form.paymentMethod === "cod" ? (
          <div className="payment-panel">
            ชำระเงินปลายทางเมื่อพัสดุถึงที่อยู่ผู้รับ
          </div>
        ) : null}

        <div
          className="payment-panel"
          style={{ display: "grid", gap: 10, marginTop: 4 }}
        >
          <strong>สรุปคำสั่งซื้อก่อนยืนยัน</strong>
          {orderItems.map((item) => (
            <div key={item.productId} className="summary-row">
              <span>
                {item.product?.name} x {item.quantity}
              </span>
              <strong>
                {formatCurrency((item.product?.price || 0) * item.quantity)}
              </strong>
            </div>
          ))}
          <div className="summary-row" style={{ paddingTop: 6 }}>
            <span>ราคารวมทั้งหมด</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>

        <div
          className="payment-panel"
          style={{ display: "grid", gap: 8, marginTop: 4 }}
        >
          <div>🔒 ชำระเงินปลอดภัย</div>
          <div>🚚 จัดส่งรวดเร็ว</div>
          <div>📞 มีช่องทางติดต่อชัดเจน</div>
        </div>

        {message ? <p className="form-message">{message}</p> : null}

        <div style={{ marginTop: 6 }}>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={submitting}
            style={{
              minHeight: 56,
              fontSize: "1rem",
              fontWeight: 700,
              background: "#2f6fe0"
            }}
          >
            {submitting ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
          </button>
          <div
            className="muted-text"
            style={{ marginTop: 8, fontSize: "0.92rem", textAlign: "center" }}
          >
            กรุณาตรวจสอบข้อมูลก่อนยืนยัน
          </div>
        </div>
      </form>

      <aside className="section-card">
        <h2>รายการสินค้า</h2>
        <div className="checkout-items">
          {orderItems.map((item) => (
            <div key={item.productId} className="checkout-item">
              <img
                src={item.product?.images[0] || ""}
                alt={item.product?.name}
                className="checkout-item-image"
              />
              <div>
                <div className="checkout-item-title">{item.product?.name}</div>
                <div className="muted-text">
                  {item.quantity} x {formatCurrency(item.product?.price || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="summary-row top-gap">
          <span>รวมทั้งหมด</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </aside>
    </div>
  );
}
