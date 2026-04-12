"use client";

import { useState } from "react";

import { useCart } from "@/components/store/cart-context";
import { Product } from "@/types";

type AddToCartButtonProps = {
  product: Product;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className="button button-secondary"
      disabled={product.stock < 1}
      onClick={() => {
        addItem(product.id, 1);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
    >
      {product.stock < 1 ? "สินค้าหมด" : added ? "เพิ่มแล้ว" : "หยิบใส่ตะกร้า"}
    </button>
  );
}
