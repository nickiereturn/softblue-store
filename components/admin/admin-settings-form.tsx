"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export function AdminSettingsForm() {
  const [promptpayNumber, setPromptpayNumber] = useState("");
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
            setPromptpayNumber(value);
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

  async function handleSave() {
    if (!promptpayNumber.trim()) {
      setMessage("กรุณากรอกเบอร์ PromptPay");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "settings", "payment"),
        {
          promptpayNumber: promptpayNumber.trim()
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
            placeholder="กรอกเบอร์ PromptPay"
            value={promptpayNumber}
            onChange={(event) => {
              setPromptpayNumber(event.target.value);
              setMessage("");
            }}
            disabled={loading || saving}
          />
        </label>

        <p className="muted-text" style={{ marginTop: -4 }}>
          ระบบจะสร้าง QR อัตโนมัติตามยอดสั่งซื้อจากเบอร์นี้
        </p>

        {message ? <p className="form-message">{message}</p> : null}

        <div className="button-row">
          <button
            type="button"
            className="button button-primary"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>
    </section>
  );
}
