import type { Metadata } from "next";

import { CartProvider } from "@/components/store/cart-context";
import { Header } from "@/components/store/header";

import "./globals.css";

export const metadata: Metadata = {
  title: "SoftBlue Store | ร้านค้าออนไลน์",
  description: "ร้านค้าออนไลน์พร้อมระบบจัดการสินค้าและคำสั่งซื้อ"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <CartProvider>
          <div className="site-shell">
            <Header />
            <main className="main-shell container">{children}</main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
