"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import { Product } from "@/types";

type ProductFormState = {
  id: string;
  name: string;
  price: string;
  stock: string;
  description: string;
  youtubeUrl: string;
  images: string[];
  files: File[];
};

const emptyForm: ProductFormState = {
  id: "",
  name: "",
  price: "",
  stock: "",
  description: "",
  youtubeUrl: "",
  images: [],
  files: []
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

const controlButtonStyle = {
  minWidth: 38,
  minHeight: 38,
  padding: 0,
  fontSize: "1rem"
} as const;

export function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const response = await fetch("/api/products");
    const payload = await response.json();
    setProducts(payload.products || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || null,
    [products, selectedId]
  );

  useEffect(() => {
    if (!selectedProduct) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: String(selectedProduct.price),
      stock: String(selectedProduct.stock),
      description: selectedProduct.description,
      youtubeUrl: selectedProduct.youtubeUrl || "",
      images: selectedProduct.images,
      files: []
    });
  }, [selectedProduct]);

  function moveImage(index: number, direction: "up" | "down") {
    setForm((current) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.images.length) {
        return current;
      }

      const nextImages = [...current.images];
      const [movedImage] = nextImages.splice(index, 1);
      nextImages.splice(nextIndex, 0, movedImage);

      return {
        ...current,
        images: nextImages
      };
    });
  }

  function removeImage(index: number) {
    const confirmed = window.confirm("ต้องการลบรูปนี้ใช่หรือไม่?");

    if (!confirmed) {
      return;
    }

    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index)
    }));
  }

  async function uploadImages() {
    if (form.files.length === 0) {
      return form.images;
    }

    const uploadedUrls: string[] = [];

    for (const file of form.files) {
      const dataUrl = await fileToDataUrl(file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: "product",
          fileName: file.name,
          mimeType: file.type,
          dataUrl
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      uploadedUrls.push(payload.url);
    }

    return [...form.images, ...uploadedUrls];
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const images = await uploadImages();

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          description: form.description,
          youtubeUrl: form.youtubeUrl,
          images
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "บันทึกสินค้าไม่สำเร็จ");
      }

      setForm(emptyForm);
      setSelectedId("");
      setMessage("บันทึกสินค้าเรียบร้อยแล้ว");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกสินค้าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("ต้องการลบสินค้านี้ใช่หรือไม่?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "ลบสินค้าไม่สำเร็จ");
      return;
    }

    setMessage("ลบสินค้าเรียบร้อยแล้ว");
    setSelectedId("");
    await loadProducts();
  }

  return (
    <div className="admin-grid">
      <section className="section-card">
        <h1>{selectedProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h1>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>ชื่อสินค้า</span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <div className="two-columns">
            <label className="field">
              <span>ราคา</span>
              <input
                required
                type="number"
                min={0}
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>สต๊อก</span>
              <input
                required
                type="number"
                min={0}
                value={form.stock}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stock: event.target.value }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span>รายละเอียดสินค้า</span>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
            />
          </label>

          <label className="field">
            <span>ลิงก์ YouTube</span>
            <input
              value={form.youtubeUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  youtubeUrl: event.target.value
                }))
              }
            />
          </label>

          <label className="field">
            <span>อัปโหลดรูปสินค้า</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  files: Array.from(event.target.files || [])
                }))
              }
            />
          </label>

          {form.images.length > 0 ? (
            <div className="thumbnail-list" style={{ gap: 14 }}>
              {form.images.map((image, index) => {
                const disableReorder = form.images.length === 1;

                return (
                  <div
                    key={`${image}-${index}`}
                    className="thumbnail-item"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "88px 1fr",
                      gap: 12,
                      alignItems: "center",
                      padding: 12,
                      border: "1px solid var(--line)",
                      borderRadius: 14,
                      background: "#f9fbff"
                    }}
                  >
                    <img
                      src={image}
                      alt="รูปสินค้า"
                      className="thumbnail-image"
                      style={{ borderRadius: 12 }}
                    />

                    <div style={{ display: "grid", gap: 8 }}>
                      <div className="muted-text" style={{ fontSize: "0.92rem" }}>
                        {index === 0 ? "รูปหลักของสินค้า" : `รูปที่ ${index + 1}`}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8
                        }}
                      >
                        <button
                          type="button"
                          className="button button-secondary"
                          style={controlButtonStyle}
                          disabled={disableReorder || index === 0}
                          onClick={() => moveImage(index, "up")}
                          aria-label="เลื่อนขึ้น"
                          title="เลื่อนขึ้น"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          className="button button-secondary"
                          style={controlButtonStyle}
                          disabled={disableReorder || index === form.images.length - 1}
                          onClick={() => moveImage(index, "down")}
                          aria-label="เลื่อนลง"
                          title="เลื่อนลง"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          className="button button-secondary"
                          style={controlButtonStyle}
                          onClick={() => removeImage(index)}
                          aria-label="ลบรูป"
                          title="ลบรูป"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {message ? <p className="form-message">{message}</p> : null}

          <div className="button-row">
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </button>

            {selectedProduct ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSelectedId("");
                  setForm(emptyForm);
                }}
              >
                ล้างข้อมูล
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="section-card">
        <h2>รายการสินค้า</h2>
        <div className="admin-product-list">
          {products.map((product) => (
            <article key={product.id} className="admin-product-card">
              <img
                src={product.images[0] || ""}
                alt={product.name}
                className="admin-product-image"
              />
              <div className="admin-product-content">
                <strong>{product.name}</strong>
                <span className="muted-text">
                  {formatCurrency(product.price)} · สต๊อก {product.stock}
                </span>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedId(product.id)}
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => handleDelete(product.id)}
                >
                  ลบ
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
