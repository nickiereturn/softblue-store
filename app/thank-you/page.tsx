import Link from "next/link";

import { formatPaymentMethod } from "@/lib/format";
import { PaymentMethod } from "@/types";

export const dynamic = "force-dynamic";

type ThankYouPageProps = {
  searchParams: Promise<{
    orderId?: string;
    paymentMethod?: string;
  }>;
};

function getPaymentMethod(value?: string): PaymentMethod | null {
  if (value === "promptpay" || value === "cod") {
    return value;
  }

  return null;
}

function getContent(paymentMethod: PaymentMethod | null) {
  if (paymentMethod === "promptpay") {
    return {
      title: "สั่งซื้อสำเร็จ 🎉",
      message:
        "คำสั่งซื้อของคุณสำเร็จแล้ว เมื่อทางร้านตรวจสอบสลิปเรียบร้อยแล้ว เราจะดำเนินการจัดส่งให้ทันที ขอบคุณที่ใช้บริการ"
    };
  }

  return {
    title: "สั่งซื้อสำเร็จ 🎉",
    message:
      "ทางร้านกำลังเตรียมจัดส่งสินค้า กรุณาชำระเงินเมื่อได้รับสินค้า ขอบคุณที่ใช้บริการ"
  };
}

export default async function ThankYouPage({
  searchParams
}: ThankYouPageProps) {
  const params = await searchParams;
  const paymentMethod = getPaymentMethod(params.paymentMethod);
  const content = getContent(paymentMethod);

  return (
    <section
      className="section-card"
      style={{
        maxWidth: 720,
        margin: "4rem auto 0",
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: "3rem", lineHeight: 1, marginBottom: 16 }}>✅</div>
      <h1>{content.title}</h1>
      <p className="muted-text" style={{ margin: "0 auto 20px", maxWidth: 560 }}>
        {content.message}
      </p>

      {params.orderId ? (
        <div
          style={{
            display: "grid",
            gap: 12,
            justifyContent: "center",
            marginBottom: 24
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 16,
              background: "#eef4ff",
              border: "1px solid #d7e1f0"
            }}
          >
            <div className="muted-text" style={{ marginBottom: 6 }}>
              หมายเลขคำสั่งซื้อ
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{params.orderId}</div>
          </div>
          <div className="muted-text">
            กรุณาบันทึกหมายเลขคำสั่งซื้อไว้เพื่อติดต่อสอบถาม
          </div>
          {paymentMethod ? (
            <div className="muted-text">
              วิธีชำระเงิน: {formatPaymentMethod(paymentMethod)}
            </div>
          ) : null}
        </div>
      ) : null}

      <Link href="/" className="button button-primary">
        กลับไปหน้าร้าน
      </Link>
    </section>
  );
}
