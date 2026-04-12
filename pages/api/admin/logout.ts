import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
  }

  response.setHeader(
    "Set-Cookie",
    serialize(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    })
  );

  response.redirect(302, "/admin/login");
}
