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
      className="button buy-now-button"
      disabled={disabled}
      onClick={() => router.push(`/checkout?buyNow=${productId}`)}
    >
      สั่งซื้อทันที 🔥
    </button>
  );
}
