import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { importDealsFromBuffer } from "@/lib/services/deals-importer";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided. Use multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      { error: "Only .csv files are supported." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importDealsFromBuffer(buffer);

  return NextResponse.json(result);
}
