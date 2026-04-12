import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProductManager } from "@/components/admin/admin-product-manager";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div>
      <AdminNav />
      <AdminProductManager />
    </div>
  );
}
