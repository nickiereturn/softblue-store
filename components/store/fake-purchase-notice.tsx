"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const messages = [
  "มีลูกค้ากำลังสั่งซื้อสินค้าอยู่ตอนนี้ 🔥",
  "มีการสั่งซื้อในช่วง 10 นาทีที่ผ่านมา"
];

export function FakePurchaseNotice() {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const isAdminPage = (pathname ?? "").startsWith("/admin");

  const message = useMemo(() => messages[index], [index]);

  useEffect(() => {
    if (isAdminPage) {
      return;
    }

    const interval = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setIndex((current) => (current + 1) % messages.length);
        setVisible(true);
      }, 350);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [isAdminPage]);

  if (isAdminPage) {
    return null;
  }

  return (
    <div
      className={visible ? "floating-purchase-badge is-visible" : "floating-purchase-badge"}
      aria-live="polite"
    >
      <span className="floating-purchase-icon" aria-hidden="true">
        🔥
      </span>
      <span>{message}</span>

      <style jsx>{`
        .floating-purchase-badge {
          position: fixed;
          left: 16px;
          bottom: 16px;
          z-index: 30;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: min(320px, calc(100vw - 32px));
          padding: 10px 14px;
          border: 1px solid rgba(215, 225, 240, 0.95);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 14px 28px rgba(20, 34, 53, 0.14);
          color: #607187;
          font-size: 0.875rem;
          line-height: 1.4;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 0.35s ease,
            transform 0.35s ease;
        }

        .floating-purchase-badge.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .floating-purchase-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        @media (max-width: 560px) {
          .floating-purchase-badge {
            left: 12px;
            right: 12px;
            bottom: 12px;
            max-width: none;
            border-radius: 18px;
          }
        }
      `}</style>
    </div>
  );
}
