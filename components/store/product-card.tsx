import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { BuyNowButton } from "@/components/store/buy-now-button";
import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="product-card-image-link">
        <img
          src={product.images[0] || "/payments/promptpay-qr.svg"}
          alt={product.name}
          className="product-card-image"
        />
      </Link>
      <div className="product-card-body">
        <Link href={`/product/${product.id}`} className="product-card-title">
          {product.name}
        </Link>
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
