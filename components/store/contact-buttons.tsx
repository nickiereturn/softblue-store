"use client";

import { CSSProperties, MouseEvent } from "react";
import Swal from "sweetalert2";

import { contactLinks } from "@/lib/constants";

const iconButtonStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#eef4ff",
  border: "1px solid #d7e1f0",
  color: "#142235",
  boxShadow: "0 12px 24px rgba(20, 34, 53, 0.08)",
  transition: "transform 0.2s ease, background-color 0.2s ease"
};

function handleMouseEnter(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.transform = "translateY(-1px)";
  event.currentTarget.style.background = "#e3eeff";
}

function handleMouseLeave(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.transform = "translateY(0)";
  event.currentTarget.style.background = "#eef4ff";
}

export function ContactButtons() {
  return (
    <div className="contact-actions" aria-label="ช่องทางติดต่อร้านค้า">
      <a
        href={contactLinks.line}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINE"
        title="LINE"
        style={iconButtonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M16 4C8.82 4 3 8.64 3 14.37c0 5.13 4.65 9.43 10.94 10.23l-1.15 4.23a.55.55 0 0 0 .81.62l4.96-3.11h.29c7.18 0 13-4.64 13-10.37C31.85 8.64 23.18 4 16 4Z"
            fill="#06C755"
          />
          <path
            d="M11 12.2c0-.4-.33-.73-.73-.73a.73.73 0 0 0-.73.73v5.2c0 .4.33.73.73.73h2.96a.73.73 0 0 0 0-1.46h-2.23V12.2Zm4.38 0c0-.4-.33-.73-.73-.73a.73.73 0 0 0-.73.73v5.2c0 .4.33.73.73.73.4 0 .73-.33.73-.73v-5.2Zm5.34 0c0-.4-.33-.73-.73-.73a.73.73 0 0 0-.73.73v3.01l-2.33-3.42a.72.72 0 0 0-.6-.32.74.74 0 0 0-.74.73v5.2c0 .4.33.73.73.73.4 0 .73-.33.73-.73v-3.01l2.33 3.42c.14.2.36.32.6.32.4 0 .74-.33.74-.73v-5.2Zm4.7 0h-3.05c-.4 0-.73.33-.73.73v5.2c0 .4.33.73.73.73h3.05a.73.73 0 0 0 0-1.46h-2.32v-.8h1.83a.73.73 0 0 0 0-1.46h-1.83v-.75h2.32a.73.73 0 0 0 0-1.46Z"
            fill="white"
          />
        </svg>
      </a>

      <button
        type="button"
        aria-label="Messenger"
        title="Messenger"
        style={iconButtonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          void Swal.fire({
            title: "ยังไม่พร้อมใช้งาน",
            text: "ขออภัยตอนนี้เมสเซนเจอยังไม่พร้อมใช้งาน และเรากำลังจะเปิดใช้งานเร็วนี้",
            icon: "info",
            confirmButtonText: "ตกลง"
          });
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M16 4C9.37 4 4 8.96 4 15.09c0 3.5 1.76 6.61 4.5 8.64V28l4.06-2.23c1.1.3 2.25.46 3.44.46 6.63 0 12-4.96 12-11.09C28 8.96 22.63 4 16 4Z"
            fill="url(#messengerGradient)"
          />
          <path
            d="m9.6 18.74 4.22-4.48 2.58 2.57 5.99-3.3-4.42 4.7-2.47-2.57-6 3.08Z"
            fill="white"
          />
          <defs>
            <linearGradient
              id="messengerGradient"
              x1="7"
              y1="6"
              x2="26"
              y2="26"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B2FF" />
              <stop offset="1" stopColor="#006AFF" />
            </linearGradient>
          </defs>
        </svg>
      </button>
    </div>
  );
}
