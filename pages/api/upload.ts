import type { NextApiRequest, NextApiResponse } from "next";

import { isAdminApiRequest } from "@/lib/auth";
import { saveUploadedDataUrl } from "@/lib/files";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
  }

  const { category, fileName, mimeType, dataUrl } = request.body || {};

  if (
    (category !== "product" && category !== "slip") ||
    typeof fileName !== "string" ||
    typeof mimeType !== "string" ||
    typeof dataUrl !== "string"
  ) {
    return response.status(400).json({ error: "ข้อมูลไฟล์ไม่ถูกต้อง" });
  }

  if (category === "product" && !isAdminApiRequest(request)) {
    return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  if (!mimeType.startsWith("image/")) {
    return response
      .status(400)
      .json({ error: "รองรับเฉพาะไฟล์รูปภาพเท่านั้น" });
  }

  try {
    const url = await saveUploadedDataUrl({
      category,
      dataUrl,
      fileName
    });

    return response.status(200).json({ url });
  } catch (error) {
    return response.status(400).json({
      error: error instanceof Error ? error.message : "ไม่สามารถบันทึกไฟล์ได้"
    });
  }
}
