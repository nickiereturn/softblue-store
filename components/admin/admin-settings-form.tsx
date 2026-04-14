"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export function AdminSettingsForm() {
  const [currentQr, setCurrentQr] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "payment"));

        if (docSnap.exists()) {
          const promptpayQR = docSnap.data().promptpayQR;

          if (typeof promptpayQR === "string") {
            setCurrentQr(promptpayQR);
          }
        }
      } catch {
        setMessage("ไม่สามารถโหลดข้อมูล QR ได้");
      } finally {
        setLoading(false);
      }
    };

    void fetchQr();
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] || null);
    setMessage("");
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("category", "product");
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok || typeof data.url !== "string") {
      throw new Error(data.error || "อัปโหลด QR ไม่สำเร็จ");
    }

    return data.url as string;
  }

  async function handleSave() {
    if (!selectedFile) {
      setMessage("กรุณาเลือกไฟล์ QR ก่อน");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const imageUrl = await handleUpload(selectedFile);

      await setDoc(
        doc(db, "settings", "payment"),
        {
          promptpayQR: imageUrl
        },
        { merge: true }
      );

      setCurrentQr(imageUrl);
      setSelectedFile(null);
      setMessage("อัปเดต QR สำเร็จ");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ไม่สามารถอัปเดต QR ได้"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section-card">
      <h1>ตั้งค่า PromptPay QR</h1>
      <div className="stack-form">
        <div style={{ display: "grid", gap: 12 }}>
          <span className="muted-text">QR ปัจจุบัน</span>
          {loading ? (
            <div className="muted-text">กำลังโหลด...</div>
          ) : currentQr ? (
            <img
              src={currentQr}
              alt="PromptPay QR"
              style={{
                width: "100%",
                maxWidth: 280,
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 16,
                border: "1px solid var(--line)",
                background: "#f8fbff"
              }}
            />
          ) : (
            <div className="muted-text">ยังไม่มี QR ที่บันทึกไว้</div>
          )}
        </div>

        <label className="field">
          <span>อัปโหลด QR ใหม่</span>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        {message ? <p className="form-message">{message}</p> : null}

        <div className="button-row">
          <button
            type="button"
            className="button button-primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "กำลังอัปเดต..." : "อัปเดต QR"}
          </button>
        </div>
      </div>
    </section>
  );
}
