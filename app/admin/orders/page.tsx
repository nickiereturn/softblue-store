import { AdminNav } from "@/components/admin/admin-nav";
import { AdminOrderList } from "@/components/admin/admin-order-list";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return (
    <div>
      <AdminNav />
      <AdminOrderList />
    </div>
  );
}
