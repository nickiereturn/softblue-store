"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "เข้าสู่ระบบไม่สำเร็จ");
      setSubmitting(false);
      return;
    }

    router.push(searchParams?.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form className="section-card login-card" onSubmit={handleSubmit}>
      <h1>เข้าสู่ระบบแอดมิน</h1>
      <label className="field">
        <span>ชื่อผู้ใช้</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>รหัสผ่าน</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <p className="muted-text">
        บัญชีเริ่มต้นถูกกำหนดไว้ใน <code>.env.example</code>
      </p>
      {message ? <p className="form-message">{message}</p> : null}
      <button type="submit" className="button button-primary" disabled={submitting}>
        {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
