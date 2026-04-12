import { Suspense } from "react";

import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="section-card login-card">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
