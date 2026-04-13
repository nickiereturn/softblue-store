import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { BuyNowButton } from "@/components/store/buy-now-button";
import { ContactButtons } from "@/components/store/contact-buttons";
import { ProductGallery } from "@/components/store/product-gallery";
import { getProductById } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { convertToEmbedUrl } from "@/lib/youtube";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const trustBadges = [
  { icon: "✓", text: "ส่งจริง 100%" },
  { icon: "🚚", text: "จัดส่งภายใน 1-2 วัน" },
  { icon: "💳", text: "รองรับ PromptPay / บัตร / เก็บเงินปลายทาง" },
  { icon: "💬", text: "มีแอดมินตอบจริง" }
];

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <section className="section-card">
        <h1>Product not found</h1>
      </section>
    );
  }

  const youtubeEmbedUrl = convertToEmbedUrl(product.youtubeUrl);

  return (
    <div className="detail-layout">
      <section className="section-card">
        <ProductGallery images={product.images} alt={product.name} />
      </section>

      <section className="section-card detail-copy">
        <div>
          <h1>{product.name}</h1>
          <div className="price-text">{formatCurrency(product.price)}</div>
        </div>
        <div className={product.stock > 0 ? "stock-badge" : "stock-badge out"}>
          {product.stock > 0 ? `พร้อมส่ง ${product.stock} ชิ้น` : "สินค้าหมด"}
        </div>
        <p className="muted-text">{product.description}</p>

        <div className="product-card-actions">
          <AddToCartButton product={product} />
          <BuyNowButton productId={product.id} disabled={product.stock < 1} />
        </div>

        <div className="trust-badges">
          {trustBadges.map((badge) => (
            <div key={badge.text} className="trust-badge">
              <span className="trust-badge-icon" aria-hidden="true">
                {badge.icon}
              </span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        <div>
          <h2>ติดต่อร้านค้า</h2>
          <ContactButtons />
        </div>

        {youtubeEmbedUrl ? (
          <div>
            <h2>วิดีโอสินค้า</h2>
            <iframe
              className="video-embed"
              src={youtubeEmbedUrl}
              width="100%"
              height="315"
              title={`วิดีโอสินค้า ${product.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
