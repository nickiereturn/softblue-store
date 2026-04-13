import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { BuyNowButton } from "@/components/store/buy-now-button";
import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  section?: "best" | "new" | "all";
};

function getProductBadge(
  product: Product,
  section: "best" | "new" | "all"
) {
  if (section === "best" && product.isBestSeller) {
    return {
      text: "🔥 ขายดี",
      className: "product-badge best-seller"
    };
  }

  if (section === "new") {
    return {
      text: "🆕 ใหม่",
      className: "product-badge new-product"
    };
  }

  return null;
}

export function ProductCard({
  product,
  section = "all"
}: ProductCardProps) {
  const badge = getProductBadge(product, section);

  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="product-card-image-link">
        <div className="product-card-image-shell">
          {badge ? <span className={badge.className}>{badge.text}</span> : null}
          <img
            src={product.image || product.images[0] || "/payments/promptpay-qr.svg"}
            alt={product.name}
            className="product-card-image"
          />
        </div>
      </Link>

      <div className="product-card-body">
        <Link href={`/product/${product.id}`} className="product-card-title">
          {product.name}
        </Link>

        <p className="product-card-description">
          {product.description.length > 60
            ? `${product.description.slice(0, 60)}...`
            : product.description}
        </p>

        <div className="product-card-meta">
          <span className="price-text">{formatCurrency(product.price)}</span>
          <span className={product.stock > 0 ? "stock-badge" : "stock-badge out"}>
            {product.stock > 0 ? `คงเหลือ ${product.stock}` : "สินค้าหมด"}
          </span>
        </div>

        <div className="product-card-actions">
          <AddToCartButton product={product} />
          <BuyNowButton productId={product.id} disabled={product.stock < 1} />
        </div>
      </div>
    </article>
  );
}
