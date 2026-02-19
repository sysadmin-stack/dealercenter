import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward all search params to the report API
  const reportUrl = new URL("/api/leads/report", request.nextUrl.origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    reportUrl.searchParams.set(key, value);
  });

  const res = await fetch(reportUrl, {
    headers: { cookie: request.headers.get("cookie") || "" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Report fetch failed" }, { status: 500 });
  }

  const { data, groupBy } = (await res.json()) as {
    data: { label: string; count: number; avgScore: number; avgDaysOld: number }[];
    groupBy: string;
  };

  // Build CSV
  const header = `${groupBy},Count,Avg Score,Avg Days Old`;
  const rows = data.map(
    (r) =>
      `"${r.label.replace(/"/g, '""')}",${r.count},${r.avgScore},${r.avgDaysOld}`,
  );
  const csv = [header, ...rows].join("\n");

  const filename = `report-${groupBy}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
