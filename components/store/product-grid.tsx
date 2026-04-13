import { ProductCard } from "@/components/store/product-card";
import { Product } from "@/types";

type ProductGridProps = {
  products: Product[];
  variant?: "default" | "featured";
  section?: "best" | "new" | "all";
};

export function ProductGrid({
  products,
  variant = "default",
  section = "all"
}: ProductGridProps) {
  return (
    <div
      className={
        variant === "featured"
          ? "product-grid featured-product-grid"
          : "product-grid"
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} section={section} />
      ))}
    </div>
  );
}
