"use client";

import { useRouter } from "next/navigation";

type BuyNowButtonProps = {
  productId: string;
  disabled?: boolean;
};

export function BuyNowButton({
  productId,
  disabled = false
}: BuyNowButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="button button-primary"
      disabled={disabled}
      onClick={() => router.push(`/checkout?buyNow=${productId}`)}
    >
      ซื้อเลย
    </button>
  );
}
