import { promises as fs } from "fs";
import path from "path";

export async function saveUploadedFile(
  file: File,
  category: "product" | "slip"
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const fileName = `${category}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${ext}`;
  const relativePath = path.join("uploads", fileName);
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return `/${relativePath.replace(/\\/g, "/")}`;
}

type DataUrlInput = {
  category: "product" | "slip";
  dataUrl: string;
  fileName: string;
};

export async function saveUploadedDataUrl({
  category,
  dataUrl,
  fileName
}: DataUrlInput) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new Error("ข้อมูลรูปภาพไม่ถูกต้อง");
  }

  const ext = path.extname(fileName) || ".png";
  const safeName = `${category}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${ext}`;
  const relativePath = path.join("uploads", safeName);
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(matches[2], "base64"));

  return `/${relativePath.replace(/\\/g, "/")}`;
}
