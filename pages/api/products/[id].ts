import type { NextApiRequest, NextApiResponse } from "next";

import { isAdminApiRequest } from "@/lib/auth";
import { deleteProduct, getProductById, saveProduct } from "@/lib/data";
import { Product } from "@/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const id = String(request.query.id || "");

  if (request.method === "GET") {
    const product = await getProductById(id);

    if (!product) {
      return response.status(404).json({ error: "ไม่พบสินค้า" });
    }

    return response.status(200).json({ product });
  }

  if (request.method === "PUT") {
    if (!isAdminApiRequest(request)) {
      return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }

    const product = request.body as Product;

    if (product.id !== id) {
      return response.status(400).json({ error: "รหัสสินค้าไม่ตรงกัน" });
    }

    const saved = await saveProduct(product);
    return response.status(200).json({ product: saved });
  }

  if (request.method === "DELETE") {
    if (!isAdminApiRequest(request)) {
      return response.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }

    await deleteProduct(id);
    return response.status(200).json({ ok: true });
  }

  response.setHeader("Allow", "GET, PUT, DELETE");
  return response.status(405).json({ error: "ไม่รองรับคำขอนี้" });
}
