"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";

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
  isBestSeller: boolean;
};

const emptyForm: ProductFormState = {
  id: "",
  name: "",
  price: "",
  stock: "",
  description: "",
  youtubeUrl: "",
  images: [],
  isBestSeller: false
};

const controlButtonStyle = {
  minWidth: 38,
  minHeight: 38,
  padding: 0,
  fontSize: "1rem"
} as const;

export function AdminProductManager() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  async function loadProducts() {
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data.products || []);
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
      setImageUrl("");
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
      isBestSeller: selectedProduct.isBestSeller
    });
    setImageUrl(selectedProduct.image || selectedProduct.images[0] || "");
  }, [selectedProduct]);

  function syncPrimaryImage(nextImages: string[]) {
    setImageUrl(nextImages[0] || "");
  }

  function moveImage(index: number, direction: "up" | "down") {
    setForm((current) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.images.length) {
        return current;
      }

      const nextImages = [...current.images];
      const [movedImage] = nextImages.splice(index, 1);
      nextImages.splice(nextIndex, 0, movedImage);
      syncPrimaryImage(nextImages);

      return {
        ...current,
        images: nextImages
      };
    });
  }

  async function removeImage(index: number) {
    const result = await Swal.fire({
      title: "ต้องการลบสินค้านี้?",
      text: "การลบจะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });

    if (!result.isConfirmed) {
      return;
    }

    setForm((current) => {
      const nextImages = current.images.filter(
        (_, imageIndex) => imageIndex !== index
      );
      syncPrimaryImage(nextImages);

      return {
        ...current,
        images: nextImages
      };
    });

    void Swal.fire({
      title: "ลบสำเร็จ",
      icon: "success",
      timer: 1200,
      showConfirmButton: false
    });
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("category", "product");
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");
    }

    setImageUrl(data.url);
    return data.url as string;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setUploadingImages(true);
    setMessage("");

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const uploadedUrl = await uploadFile(file);
        uploadedUrls.push(uploadedUrl);
      }

      setForm((current) => {
        const nextImages = [...current.images, ...uploadedUrls];
        syncPrimaryImage(nextImages);

        return {
          ...current,
          images: nextImages
        };
      });

      setMessage("อัปโหลดรูปภาพเรียบร้อยแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setUploadingImages(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const primaryImage = imageUrl || form.images[0] || "";

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
          isBestSeller: form.isBestSeller,
          image: primaryImage,
          images: form.images.length > 0 ? form.images : primaryImage ? [primaryImage] : []
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "บันทึกสินค้าไม่สำเร็จ");
      }

      setForm(emptyForm);
      setImageUrl("");
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
    const result = await Swal.fire({
      title: "ต้องการลบสินค้านี้?",
      text: "การลบจะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });

    if (!result.isConfirmed) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "ลบสินค้าไม่สำเร็จ");
      return;
    }

    setMessage("ลบสินค้าเรียบร้อยแล้ว");
    setSelectedId("");
    await Swal.fire({
      title: "ลบสำเร็จ",
      icon: "success",
      timer: 1200,
      showConfirmButton: false
    });
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

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.95rem"
            }}
          >
            <input
              type="checkbox"
              checked={form.isBestSeller}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isBestSeller: event.target.checked
                }))
              }
            />
            <span>ตั้งเป็นสินค้าขายดี 🔥</span>
          </label>

          <label className="field">
            <span>อัปโหลดรูปสินค้า</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </label>

          {imageUrl ? (
            <div style={{ display: "grid", gap: 8 }}>
              <span className="muted-text" style={{ fontSize: "0.9rem" }}>
                รูปหลักที่จะบันทึก
              </span>
              <img
                src={imageUrl}
                alt="รูปหลักสินค้า"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: "1px solid var(--line)"
                }}
              />
            </div>
          ) : null}

          {uploadingImages ? (
            <p className="muted-text" style={{ marginTop: -4 }}>
              กำลังอัปโหลดรูปภาพ...
            </p>
          ) : null}

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
            <button
              type="submit"
              className="button button-primary"
              disabled={saving || uploadingImages}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </button>

            {selectedProduct ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSelectedId("");
                  setForm(emptyForm);
                  setImageUrl("");
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
                src={product.image || product.images[0] || ""}
                alt={product.name}
                className="admin-product-image"
              />
              <div className="admin-product-content">
                <strong>{product.name}</strong>
                <span className="muted-text">
                  {formatCurrency(product.price)} | สต๊อก {product.stock}
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
