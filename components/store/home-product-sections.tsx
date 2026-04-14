"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { ProductGrid } from "@/components/store/product-grid";
import { db } from "@/lib/firebase";
import { Product } from "@/types";

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
  id: string,
  data: Record<string, unknown>
): Product | null {
  const name = typeof data.name === "string" ? data.name : "";
  const description =
    typeof data.description === "string" ? data.description : "";
  const price =
    typeof data.price === "number" ? data.price : Number(data.price || 0);
  const stock =
    typeof data.stock === "number" ? data.stock : Number(data.stock || 0);
  const image = typeof data.image === "string" ? data.image : "";
  const images = Array.isArray(data.images)
    ? data.images.filter((item): item is string => typeof item === "string")
    : image
      ? [image]
      : [];

  if (!name || !description || !Number.isFinite(price) || !Number.isFinite(stock)) {
    return null;
  }

  return {
    id,
    name,
    price,
    stock,
    description,
    image: image || images[0] || "",
    images,
    youtubeUrl: typeof data.youtubeUrl === "string" ? data.youtubeUrl : "",
    isBestSeller: Boolean(data.isBestSeller),
    createdAt: normalizeCreatedAt(data.createdAt)
  };
}

export function HomeProductSections() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = querySnapshot.docs
          .map((entry) =>
            normalizeProduct(entry.id, entry.data() as Record<string, unknown>)
          )
          .filter((product): product is Product => Boolean(product));

        setProducts(items);
      } catch {
        setError("ไม่สามารถโหลดสินค้าได้ในขณะนี้");
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, []);

  const bestSellerProducts = products
    .filter((product) => product.isBestSeller)
    .slice(0, 4);
  const newProducts = [...products]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    )
    .slice(0, 4);

  if (loading) {
    return (
      <section className="section-spacing" id="all-products">
        <div className="section-card">
          <h2>กำลังโหลดสินค้า...</h2>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-spacing" id="all-products">
        <div className="section-card">
          <h2>สินค้า</h2>
          <p className="form-message">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {bestSellerProducts.length > 0 ? (
        <section className="section-spacing">
          <div className="section-card">
            <h2>สินค้าขายดี</h2>
            <ProductGrid
              products={bestSellerProducts}
              variant="featured"
              section="best"
            />
          </div>
        </section>
      ) : null}

      {newProducts.length > 0 ? (
        <section className="section-spacing">
          <div className="section-card">
            <h2>สินค้ามาใหม่</h2>
            <ProductGrid
              products={newProducts}
              variant="featured"
              section="new"
            />
          </div>
        </section>
      ) : null}

      <section className="section-spacing" id="all-products">
        <div className="section-card">
          <h2>สินค้าทั้งหมด</h2>
          <ProductGrid products={products} section="all" />
        </div>
      </section>
    </>
  );
}
