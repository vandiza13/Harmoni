import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "10")) * 1024 * 1024;
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || "image/jpeg,image/png,image/webp,application/pdf").split(",");

// ─── GET: generate presigned URL for direct upload ───────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const contentType = searchParams.get("contentType");
    let folder = searchParams.get("folder") || "uploads";
    // Sanitize folder to prevent path traversal
    folder = folder.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    // Basic extension check
    const validExts: Record<string, string[]> = {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "application/pdf": ["pdf"]
    };
    if (!validExts[contentType] || !validExts[contentType].includes(ext)) {
      return NextResponse.json({ error: "File extension does not match content type" }, { status: 400 });
    }

    const key = `${folder}/${session.user.id}/${nanoid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 }); // 5 min

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// ─── POST: direct file upload (for smaller files) ────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let folder = (formData.get("folder") as string) || "uploads";
    folder = folder.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    // Basic extension check
    const validExts: Record<string, string[]> = {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "application/pdf": ["pdf"]
    };
    if (!validExts[file.type] || !validExts[file.type].includes(ext)) {
      return NextResponse.json({ error: "File extension does not match content type" }, { status: 400 });
    }

    const key = `${folder}/${session.user.id}/${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: file.size,
      })
    );

    return NextResponse.json({
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`,
      size: file.size,
      mimeType: file.type,
      originalName: file.name,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ─── DELETE: remove a file ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }

    // Security: only allow deletion of files owned by the user
    // Make sure the key exactly starts with a valid folder and the user's ID to prevent bypass
    const isValidKey = key.startsWith(`uploads/${session.user.id}/`) || 
                       key.startsWith(`documents/${session.user.id}/`) ||
                       key.startsWith(`avatars/${session.user.id}/`);
                       
    if (!isValidKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
