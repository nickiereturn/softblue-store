"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

import { useCart } from "@/components/store/cart-context";
import { paymentOptions } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

type CheckoutState = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "promptpay" | "cod";
  slipFile: File | null;
};

const initialState: CheckoutState = {
  customerName: "",
  phone: "",
  address: "",
  paymentMethod: "promptpay",
  slipFile: null
};

export function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slipUploadRef = useRef<HTMLDivElement | null>(null);
  const buyNowId = searchParams?.get("buyNow") || null;
  const { items, clearCart } = useCart();
  const [form, setForm] = useState(initialState);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSlipError, setShowSlipError] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [promptpayNumber, setPromptpayNumber] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    const fetchNumber = async () => {
      const docSnap = await getDoc(doc(db, "settings", "payment"));

      if (docSnap.exists()) {
        const value = docSnap.data().promptpayNumber;

        if (typeof value === "string") {
          setPromptpayNumber(value);
        }
      }
    };

    void fetchNumber();
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

  const qrUrl = promptpayNumber
    ? `https://promptpay.io/${promptpayNumber}/${total}.png`
    : "";
  const promptPayNeedsSlip =
    form.paymentMethod === "promptpay" && !form.slipFile;

  function scrollToSlipUpload() {
    slipUploadRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function handlePhoneChange(value: string) {
    if (!/^\d*$/.test(value)) {
      setPhoneError("กรุณาใส่เป็นตัวเลขเท่านั้น");
      return;
    }

    setForm((current) => ({ ...current, phone: value }));

    if (value.length > 0 && !/^0\d{0,9}$/.test(value)) {
      setPhoneError("เบอร์ต้องขึ้นต้นด้วย 0");
      return;
    }

    if (value.length === 10 && !/^0\d{9}$/.test(value)) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง");
      return;
    }

    setPhoneError("");
  }

  async function uploadSlip() {
    if (!form.slipFile) {
      return "";
    }

    const formData = new FormData();
    formData.append("category", "slip");
    formData.append("image", form.slipFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
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

    if (!/^0\d{9}$/.test(form.phone)) {
      setPhoneError("กรุณาใส่เบอร์โทรให้ถูกต้อง");
      return;
    }

    if (form.paymentMethod === "promptpay" && !promptpayNumber) {
      setMessage("ร้านค้ายังไม่ได้ตั้งค่า PromptPay");
      return;
    }

    if (promptPayNeedsSlip) {
      setShowSlipError(true);
      scrollToSlipUpload();
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันคำสั่งซื้อ?",
      text: "กรุณาตรวจสอบข้อมูลก่อนดำเนินการ",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280"
    });

    if (!result.isConfirmed) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      if (orderItems.length === 0) {
        throw new Error("ยังไม่มีสินค้าในรายการสั่งซื้อ");
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
      setShowSlipError(false);
      setPhoneError("");
      await Swal.fire({
        title: "สั่งซื้อสำเร็จ 🎉",
        text: "ขอบคุณสำหรับการสั่งซื้อ เราจะดำเนินการจัดส่งให้เร็วที่สุด",
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#16a34a"
      });
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
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง"
      });
      setSubmitting(false);
    }
  }

  function handleConfirmClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (promptPayNeedsSlip) {
      event.preventDefault();
      setShowSlipError(true);
      scrollToSlipUpload();
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
            type="text"
            value={form.phone}
            placeholder="กรอกเบอร์โทร (10 หลัก)"
            inputMode="numeric"
            maxLength={10}
            onChange={(event) => handlePhoneChange(event.target.value)}
            style={{
              borderColor: phoneError ? "#ef4444" : undefined
            }}
          />
          {phoneError ? (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.875rem",
                margin: "0.35rem 0 0"
              }}
            >
              {phoneError}
            </p>
          ) : null}
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
                  onChange={() => {
                    setForm((current) => ({
                      ...current,
                      paymentMethod: option.id
                    }));
                    setShowSlipError(false);
                    setMessage("");
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {form.paymentMethod === "promptpay" ? (
          <div className="payment-panel" id="slip-upload" ref={slipUploadRef}>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="PromptPay QR"
                className="promptpay-image"
              />
            ) : (
              <div className="muted-text">ยังไม่มีการตั้งค่าเบอร์ PromptPay</div>
            )}
            <p className="muted-text" style={{ marginTop: 0, textAlign: "center" }}>
              กรุณาชำระเงินจำนวน {formatCurrency(total)}
            </p>
            <p className="muted-text" style={{ marginTop: 0 }}>
              กรุณาโอนเงินตามยอดและแนบสลิป
            </p>
            <label className="field">
              <span>อัปโหลดสลิปการโอนเงิน</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    slipFile: event.target.files?.[0] || null
                  }));
                  setShowSlipError(false);
                }}
              />
            </label>

            {showSlipError ? (
              <div className="slip-warning">
                <span className="slip-warning-icon" aria-hidden="true">
                  ⚠️
                </span>
                <span>กรุณาอัปโหลดสลิปการโอนเงินก่อน</span>
              </div>
            ) : null}
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
            className="button full-width"
            aria-disabled={submitting || promptPayNeedsSlip}
            onClick={handleConfirmClick}
            disabled={submitting}
            style={{
              minHeight: 56,
              fontSize: "1rem",
              fontWeight: 700,
              color: "#ffffff",
              background: promptPayNeedsSlip ? "#9ca3af" : "#2563eb",
              cursor: promptPayNeedsSlip ? "not-allowed" : "pointer"
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

        <style jsx>{`
          .slip-warning {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            color: #ef4444;
            font-size: 0.92rem;
            animation: slip-warning-pulse 1.1s ease-in-out infinite;
          }

          .slip-warning-icon {
            display: inline-flex;
            animation: slip-warning-bounce 0.9s ease-in-out infinite;
          }

          @keyframes slip-warning-pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.55;
            }
          }

          @keyframes slip-warning-bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }
        `}</style>
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
