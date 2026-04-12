import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

import {
  ADMIN_COOKIE_NAME,
  getAdminSessionValue,
  isValidAdminLogin
} from "@/lib/auth";

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
  }

  const { username, password } = request.body || {};

  if (!isValidAdminLogin(username, password)) {
    return response.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

  response.setHeader(
    "Set-Cookie",
    serialize(ADMIN_COOKIE_NAME, getAdminSessionValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    })
  );

  return response.status(200).json({ ok: true });
}
