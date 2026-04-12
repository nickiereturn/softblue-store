"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/store/cart-context";

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const isAdmin = (pathname ?? "").startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link
          className="brand-mark"
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none"
          }}
        >
          <Image
            src="/logo.png"
            alt="SoftBlue Store"
            width={144}
            height={48}
            priority
            style={{
              width: "auto",
              height: "clamp(40px, 7vw, 48px)"
            }}
          />
          <span
            style={{
              fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            SoftBlue Store
          </span>
        </Link>

        <nav className="top-nav">
          <Link href="/">ร้านค้า</Link>
          <Link href="/cart">ตะกร้า ({itemCount})</Link>
        </nav>
      </div>
    </header>
  );
}
