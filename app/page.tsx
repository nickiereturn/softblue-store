import Image from "next/image";
import Link from "next/link";

import { ContactButtons } from "@/components/store/contact-buttons";
import { ProductGrid } from "@/components/store/product-grid";
import { getProducts } from "@/lib/data";

export default async function HomePage() {
  const products = await getProducts();
  const bestSellerProducts = products.filter((product) => product.isBestSeller).slice(0, 4);
  const newProducts = [...products]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    )
    .slice(0, 4);

  return (
    <div>
      <section className="hero">
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20
            }}
          >
            <Image
              src="/logo.png"
              alt="SoftBlue Store"
              width={240}
              height={80}
              priority
              style={{
                width: "auto",
                height: "clamp(60px, 14vw, 80px)"
              }}
            />
          </div>

          <h1>ช้อปง่าย สินค้าครบ จบในไม่กี่ขั้นตอน</h1>
          <p>
            เลือกดูสินค้า เปิดรายละเอียด หยิบใส่ตะกร้า หรือกดซื้อได้ทันที
            ด้วยขั้นตอนสั่งซื้อที่ใช้งานง่ายบนมือถือ
          </p>
          <div className="hero-actions">
            <Link href="#all-products" className="button button-primary">
              เลือกซื้อสินค้า
            </Link>
          </div>
        </div>

        <div className="section-card">
          <h2>ติดต่อร้านค้า</h2>
          <p className="muted-text">
            สอบถามรายละเอียดสินค้าเพิ่มเติมได้ผ่านช่องทางที่คุณสะดวก
          </p>
          <ContactButtons />
        </div>
      </section>

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
    </div>
  );
}
