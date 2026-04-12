"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/store/cart-context";
import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

export function CartPageContent() {
  const { items, removeItem, setQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  const entries = useMemo(
    () =>
      items
        .map((item) => ({
          cart: item,
          product: products.find((product) => product.id === item.productId)
        }))
        .filter((entry) => entry.product),
    [items, products]
  );

  const total = entries.reduce(
    (sum, entry) => sum + (entry.product?.price || 0) * entry.cart.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <section className="section-card">
        <h1>ยังไม่มีสินค้าในตะกร้า</h1>
        <p>เลือกสินค้าที่ต้องการก่อน แล้วค่อยกลับมาชำระเงินได้เลย</p>
        <Link className="button button-primary" href="/">
          กลับไปเลือกสินค้า
        </Link>
      </section>
    );
  }

  return (
    <div className="cart-layout">
      <section className="section-card">
        <h1>ตะกร้าสินค้า</h1>
        <div className="cart-list">
          {entries.map((entry) => (
            <div key={entry.cart.productId} className="cart-row">
              <img
                src={entry.product?.images[0] || ""}
                alt={entry.product?.name}
                className="cart-row-image"
              />
              <div className="cart-row-info">
                <div className="cart-row-title">{entry.product?.name}</div>
                <div className="muted-text">
                  {formatCurrency(entry.product?.price || 0)}
                </div>
              </div>
              <input
                type="number"
                min={1}
                max={entry.product?.stock || 1}
                value={entry.cart.quantity}
                onChange={(event) =>
                  setQuantity(entry.cart.productId, Number(event.target.value))
                }
                className="qty-input"
              />
              <button
                type="button"
                className="text-button"
                onClick={() => removeItem(entry.cart.productId)}
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      </section>
      <aside className="section-card cart-summary">
        <h2>สรุปรายการสั่งซื้อ</h2>
        <div className="summary-row">
          <span>รวมทั้งหมด</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <Link className="button button-primary full-width" href="/checkout">
          ไปหน้าชำระเงิน
        </Link>
      </aside>
    </div>
  );
}
