import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminNav />
      <AdminSettingsForm />
    </div>
  );
}
