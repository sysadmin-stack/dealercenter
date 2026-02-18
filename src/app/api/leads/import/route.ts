import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { importLeadsFromBuffer } from "@/lib/services/lead-importer";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const yearStr = formData.get("year") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided. Use multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }

  if (!file.name.endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Only .xlsx files are supported." },
      { status: 400 },
    );
  }

  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importLeadsFromBuffer(buffer, year);

  return NextResponse.json(result);
}
