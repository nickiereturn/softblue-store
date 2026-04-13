import type { NextApiRequest, NextApiResponse } from "next";

import { isAdminApiRequest } from "@/lib/auth";
import { getProducts, saveProduct } from "@/lib/data";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "GET") {
    const products = await getProducts();
    return response.status(200).json({ products });
  }

  if (request.method === "POST") {
    if (!isAdminApiRequest(request)) {
      return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }

    const product = request.body || {};
    const hasPrimaryImage =
      typeof product.image === "string" && product.image.trim().length > 0;
    const hasImages =
      Array.isArray(product.images) && product.images.length > 0;

    if (
      !product.name ||
      typeof product.price !== "number" ||
      typeof product.stock !== "number" ||
      !product.description ||
      (!hasPrimaryImage && !hasImages)
    ) {
      return response.status(400).json({ error: "กรอกข้อมูลไม่ครบถ้วน" });
    }

    const saved = await saveProduct(product);
    return response.status(200).json({ product: saved });
  }

  response.setHeader("Allow", "GET, POST");
  return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
}
