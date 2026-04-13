import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function uploadBuffer(
  buffer: Buffer,
  options: {
    category: string;
    fileName: string;
  }
) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `simple-commerce-store/${options.category}`,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override: options.fileName.replace(/\.[^.]+$/, "")
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("ไม่สามารถอัปโหลดรูปภาพได้"));
          return;
        }

        resolve({ secure_url: result.secure_url });
      }
    );

    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  if (!hasCloudinaryConfig()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า Cloudinary ในตัวแปรแวดล้อม" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const category = String(formData.get("category") || "product");
  const image = formData.get("image");

  if (category === "product" && !isAdminRequest(request)) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  if (!(image instanceof File)) {
    return Response.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return Response.json(
      { error: "รองรับเฉพาะไฟล์รูปภาพเท่านั้น" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      category,
      fileName: image.name
    });

    return Response.json({
      url: result.secure_url
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "ไม่สามารถอัปโหลดรูปภาพได้"
      },
      { status: 400 }
    );
  }
}
