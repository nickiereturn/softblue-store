"use client";

type PendingOrderAlertProps = {
  count: number;
};

export function PendingOrderAlert({ count }: PendingOrderAlertProps) {
  const hasPendingOrders = count > 0;

  return (
    <div
      className="metric-card"
      style={
        hasPendingOrders
          ? {
              background: "#FFF4E5",
              border: "1px solid #f0c48a"
            }
          : undefined
      }
    >
      <div
        className="muted-text"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <span>รอดำเนินการ</span>
        {hasPendingOrders ? (
          <span
            className="pending-alert"
            aria-label={`มีคำสั่งซื้อรอดำเนินการ ${count} รายการ`}
          >
            <span className="pending-bell" aria-hidden="true">
              🔔
            </span>
            <span className="pending-badge">{count}</span>
          </span>
        ) : null}
      </div>
      <div className="metric-value">{count}</div>

      <style jsx>{`
        .pending-alert {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .pending-bell {
          display: inline-flex;
          animation: pending-blink 1.2s ease-in-out infinite;
          transform-origin: center;
        }

        .pending-badge {
          min-width: 1.5rem;
          height: 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.45rem;
          border-radius: 999px;
          background: #f2994a;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          line-height: 1;
        }

        @keyframes pending-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
