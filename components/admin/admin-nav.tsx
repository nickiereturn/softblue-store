import Link from "next/link";

export function AdminNav() {
  return (
    <div className="admin-nav">
      <div className="admin-nav-links">
        <Link href="/admin">แดชบอร์ด</Link>
        <Link href="/admin/products">สินค้า</Link>
        <Link href="/admin/orders">คำสั่งซื้อ</Link>
      </div>
      <form action="/api/admin/logout" method="post">
        <button type="submit" className="button button-secondary">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
