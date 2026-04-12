import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { AdminNav } from "@/components/admin/admin-nav";
import { PendingOrderAlert } from "@/components/admin/PendingOrderAlert";
import { getOrders, getProducts } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  noStore();

  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(
    (order) => !order.status || order.status === "pending"
  ).length;

  return (
    <div>
      <AdminNav />
      <section className="section-card">
        <h1>แดชบอร์ดแอดมิน</h1>
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="muted-text">จำนวนสินค้า</div>
            <div className="metric-value">{products.length}</div>
          </div>

          <div className="metric-card">
            <div className="muted-text">คำสั่งซื้อทั้งหมด</div>
            <div className="metric-value">{orders.length}</div>
          </div>

          <PendingOrderAlert count={pendingOrders} />

          <div className="metric-card">
            <div className="muted-text">ยอดขายรวม</div>
            <div className="metric-value">{formatCurrency(revenue)}</div>
          </div>

          <div className="metric-card">
            <div className="muted-text">สินค้าใกล้หมด</div>
            <div className="metric-value">
              {products.filter((product) => product.stock < 5).length}
            </div>
          </div>
        </div>

        <div className="button-row section-spacing">
          <Link className="button button-primary" href="/admin/products">
            จัดการสินค้า
          </Link>
          <Link className="button button-secondary" href="/admin/orders">
            ดูคำสั่งซื้อ
          </Link>
        </div>
      </section>
    </div>
  );
}
