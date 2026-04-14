"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export function AdminSettingsForm() {
  const [promptpayNumber, setPromptpayNumber] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "payment"));

        if (docSnap.exists()) {
          const value = docSnap.data().promptpayNumber;

          if (typeof value === "string") {
            setPromptpayNumber(value.replace(/\D/g, "").slice(0, 10));
          }
        }
      } catch {
        setMessage("ไม่สามารถโหลดข้อมูล PromptPay ได้");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  function handleChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);

    setPromptpayNumber(cleaned);
    setMessage("");

    if (cleaned.length === 0) {
      setError("");
    } else if (cleaned.length !== 10) {
      setError("กรุณากรอกเบอร์ให้ครบ 10 หลัก");
    } else {
      setError("");
    }
  }

  async function handleSave() {
    if (promptpayNumber.length !== 10) {
      setError("กรุณากรอกเบอร์ให้ครบ 10 หลัก");
      alert("กรุณากรอกเบอร์ให้ถูกต้อง");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "settings", "payment"),
        {
          promptpayNumber
        },
        { merge: true }
      );

      setMessage("บันทึกเบอร์ PromptPay สำเร็จ");
    } catch {
      setMessage("ไม่สามารถบันทึกเบอร์ PromptPay ได้");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section-card">
      <h1>ตั้งค่า PromptPay</h1>
      <div className="stack-form">
        <label className="field">
          <span>เบอร์ PromptPay ปัจจุบัน</span>
          <input
            type="text"
            value={promptpayNumber}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="กรอกเบอร์ PromptPay (10 หลัก)"
            inputMode="numeric"
            maxLength={10}
            disabled={loading || saving}
            style={{
              borderColor: error ? "#ef4444" : undefined
            }}
          />
          {error ? (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.875rem",
                margin: "0.35rem 0 0"
              }}
            >
              {error}
            </p>
          ) : null}
        </label>

        <p className="muted-text" style={{ marginTop: -4 }}>
          ระบบจะสร้าง QR อัตโนมัติตามยอดสั่งซื้อจากเบอร์นี้
        </p>

        {message ? <p className="form-message">{message}</p> : null}

        <div className="button-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || promptpayNumber.length !== 10}
            className="button"
            style={{
              background:
                loading || saving || promptpayNumber.length !== 10
                  ? "#9ca3af"
                  : "#2563eb",
              color: "#ffffff",
              cursor:
                loading || saving || promptpayNumber.length !== 10
                  ? "not-allowed"
                  : "pointer"
            }}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </section>
  );
}
