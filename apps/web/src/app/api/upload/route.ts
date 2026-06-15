import { NextRequest, NextResponse } from "next/server";

const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured on the server." },
      { status: 500 }
    );
  }

  // Forward the multipart/form-data directly to Pinata
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Validate type and size (max 5 MB)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 5 MB limit." }, { status: 400 });
  }

  const body = new FormData();
  body.append("file", file, file.name || "avatar.jpg");
  body.append("name", `veild-avatar-${Date.now()}`);

  const res = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Pinata upload failed:", res.status, text);
    return NextResponse.json(
      { error: "Upload to IPFS failed. Please try again." },
      { status: 502 }
    );
  }

  const json = await res.json();
  const cid: string = json?.data?.cid;

  if (!cid) {
    return NextResponse.json({ error: "Pinata did not return a CID." }, { status: 502 });
  }

  return NextResponse.json({ cid });
  //ewe
}
