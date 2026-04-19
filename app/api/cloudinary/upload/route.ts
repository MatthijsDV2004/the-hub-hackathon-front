import { createHash } from "crypto";
import { requireAdminHubSession } from "@/lib/auth/request";

type CloudinaryUploadBody = {
  imageBase64?: string;
  mimeType?: string;
  shelfName?: string;
};

function readEnv(name: string) {
  const value = process.env[name];
  const trimmed = value?.trim() || "";
  return trimmed || null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

function resolveUploadFolder(shelfName: string | undefined, hubDomain: string) {
  const rootFolder = readEnv("CLOUDINARY_UPLOAD_FOLDER") || "hub-inventory";
  const domainSegment = slugify(hubDomain.replace(/\./g, "-"));
  const shelfSegment = shelfName ? slugify(shelfName) : "";

  if (!domainSegment && !shelfSegment) {
    return rootFolder;
  }

  if (!domainSegment) {
    return `${rootFolder}/${shelfSegment}`;
  }

  if (!shelfSegment) {
    return `${rootFolder}/${domainSegment}`;
  }

  return `${rootFolder}/${domainSegment}/${shelfSegment}`;
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireAdminHubSession(request);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const cloudName = readEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = readEnv("CLOUDINARY_API_KEY");
    const apiSecret = readEnv("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json(
        {
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CloudinaryUploadBody;
    const imageBase64 = body.imageBase64?.trim() || "";
    const mimeType = body.mimeType?.trim() || "image/jpeg";

    if (!imageBase64) {
      return Response.json({ error: "Missing imageBase64." }, { status: 400 });
    }

    if (!mimeType.startsWith("image/")) {
      return Response.json({ error: "Unsupported mimeType. Expected an image mime type." }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = resolveUploadFolder(body.shelfName, session.hubDomain);

    const signature = signCloudinaryParams(
      {
        folder,
        timestamp,
      },
      apiSecret
    );

    const formData = new FormData();
    formData.set("file", `data:${mimeType};base64,${imageBase64}`);
    formData.set("api_key", apiKey);
    formData.set("timestamp", timestamp);
    formData.set("signature", signature);
    formData.set("folder", folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const rawText = await uploadResponse.text();
    let payload: Record<string, unknown> | null = null;

    try {
      payload = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
    } catch {
      payload = null;
    }

    if (!uploadResponse.ok) {
      const cloudinaryError =
        payload && typeof payload.error === "object" && payload.error
          ? (payload.error as Record<string, unknown>).message
          : null;

      const message =
        typeof cloudinaryError === "string" && cloudinaryError
          ? cloudinaryError
          : `Cloudinary upload failed (${uploadResponse.status}).`;

      return Response.json({ error: message }, { status: 502 });
    }

    const secureUrl = payload && typeof payload.secure_url === "string" ? payload.secure_url : "";
    const publicId = payload && typeof payload.public_id === "string" ? payload.public_id : null;

    if (!secureUrl) {
      return Response.json(
        { error: "Cloudinary did not return a secure_url." },
        { status: 502 }
      );
    }

    return Response.json({
      secureUrl,
      publicId,
      folder,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image to Cloudinary.";

    return Response.json({ error: message }, { status: 500 });
  }
}
