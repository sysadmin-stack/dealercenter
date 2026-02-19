"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Users, FileText } from "lucide-react";

interface IntelligenceData {
  geo: {
    byCityState: { city: string; zip: string; count: number }[];
    topZips: { zip: string; count: number }[];
    total: number;
    withAddress: number;
    unknownAddress: number;
  };
  demographics: {
    byAgeGroup: { group: string; count: number }[];
    byImportedYear: { year: number | null; count: number }[];
    byScoreRange: { range: string; count: number }[];
    avgScore: number;
    avgDaysOld: number;
  };
  pipeline: {
    byStatus: { label: string; count: number }[];
    bySource: { label: string; count: number }[];
    byOriginType: { label: string; count: number }[];
    bySalesRep: { label: string; count: number; avgScore: number }[];
    creditAppRate: number;
    optOutRate: number;
  };
  segments: Record<string, number>;
  languages: Record<string, number>;
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads/intelligence")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500">Failed to load intelligence data.</p>;
  }

  const topCity = data.geo.byCityState[0];
  const topZip = data.geo.topZips[0];
  const maxCityCount = data.geo.byCityState[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Intelligence
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="size-3.5" />
            {data.geo.total.toLocaleString()} leads analyzed
          </p>
        </div>
        <Link href="/dashboard/intelligence/reports">
          <Button className="bg-[#1b2a4a] text-white hover:bg-[#243656]">
            <FileText className="size-4" />
            Report Builder
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geo" className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <TabsList>
          <TabsTrigger value="geo">Geographic</TabsTrigger>
          <TabsTrigger value="demo">Demographic</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        {/* === GEO TAB === */}
        <TabsContent value="geo" className="mt-6 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              accent="#5b8def"
              label="With Address"
              value={data.geo.withAddress}
              sub={`${data.geo.unknownAddress} unknown`}
              delay={0}
            />
            <StatCard
              accent="#10b981"
              label="Top City"
              value={topCity ? topCity.city : "—"}
              sub={topCity ? `${topCity.count} leads` : ""}
              delay={60}
            />
            <StatCard
              accent="#f59e0b"
              label="Top ZIP"
              value={topZip ? topZip.zip : "—"}
              sub={topZip ? `${topZip.count} leads` : ""}
              delay={120}
            />
          </div>

          {/* City list */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">
                Leads by City
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.geo.byCityState.slice(0, 15).map((c, i) => (
                <BarRow
                  key={`${c.city}-${c.zip}`}
                  label={`${c.city}, FL ${c.zip}`}
                  count={c.count}
                  max={maxCityCount}
                  delay={i * 40}
                  from="#5b8def"
                  to="#3b6fd4"
                />
              ))}
              {data.geo.byCityState.length === 0 && (
                <p className="text-sm text-slate-400">No address data available</p>
              )}
            </CardContent>
          </Card>

          {/* ZIP tiles */}
          {data.geo.topZips.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-500">
                  ZIP Code Density
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.geo.topZips.slice(0, 30).map((z) => {
                    const opacity = Math.max(
                      0.2,
                      z.count / (data.geo.topZips[0]?.count || 1),
                    );
                    return (
                      <div
                        key={z.zip}
                        className="rounded-lg px-3 py-2 text-center"
                        style={{
                          backgroundColor: `rgba(91, 141, 239, ${opacity})`,
                        }}
                      >
                        <p
                          className="text-xs font-bold tabular-nums text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {z.zip}
                        </p>
                        <p className="text-[10px] text-white/80">{z.count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === DEMOGRAPHIC TAB === */}
        <TabsContent value="demo" className="mt-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              accent="#5b8def"
              label="Avg Score"
              value={data.demographics.avgScore}
              sub="out of 120"
              delay={0}
            />
            <StatCard
              accent="#10b981"
              label="Avg Days Old"
              value={data.demographics.avgDaysOld}
              sub="days"
              delay={60}
            />
            <StatCard
              accent="#f59e0b"
              label="Total Leads"
              value={data.geo.total}
              sub=""
              delay={120}
            />
          </div>

          {/* Age groups */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">
                Age Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.demographics.byAgeGroup
                .filter((a) => a.group !== "Unknown")
                .map((a, i) => (
                  <BarRow
                    key={a.group}
                    label={a.group}
                    count={a.count}
                    max={Math.max(
                      ...data.demographics.byAgeGroup.map((x) => x.count),
                      1,
                    )}
                    delay={i * 40}
                    from="#8b5cf6"
                    to="#6d28d9"
                  />
                ))}
            </CardContent>
          </Card>

          {/* Language cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["EN", "PT", "ES"] as const).map((lang, i) => {
              const colors = {
                EN: "#5b8def",
                PT: "#10b981",
                ES: "#f59e0b",
              };
              const labels = {
                EN: "English",
                PT: "Portuguese",
                ES: "Spanish",
              };
              return (
                <StatCard
                  key={lang}
                  accent={colors[lang]}
                  label={labels[lang]}
                  value={data.languages[lang] || 0}
                  sub="leads"
                  delay={i * 60}
                />
              );
            })}
          </div>

          {/* Score distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.demographics.byScoreRange.map((s, i) => (
                <BarRow
                  key={s.range}
                  label={s.range}
                  count={s.count}
                  max={Math.max(
                    ...data.demographics.byScoreRange.map((x) => x.count),
                    1,
                  )}
                  delay={i * 40}
                  from="#5b8def"
                  to="#3b6fd4"
                />
              ))}
            </CardContent>
          </Card>

          {/* Imported year */}
          {data.demographics.byImportedYear.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-500">
                  Import Year
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.demographics.byImportedYear.map((y, i) => (
                  <BarRow
                    key={y.year}
                    label={String(y.year)}
                    count={y.count}
                    max={Math.max(
                      ...data.demographics.byImportedYear.map((x) => x.count),
                      1,
                    )}
                    delay={i * 40}
                    from="#f59e0b"
                    to="#d97706"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === PIPELINE TAB === */}
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          {/* Rates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { label: "Credit App Rate", value: `${data.pipeline.creditAppRate}%`, accent: "#10b981" },
              { label: "Opt-Out Rate", value: `${data.pipeline.optOutRate}%`, accent: "#ef4444" },
            ].map((item, i) => (
              <StatCard
                key={item.label}
                accent={item.accent}
                label={item.label}
                value={item.value}
                sub=""
                delay={i * 60}
              />
            ))}
            {/* Segment cards */}
            {(["HOT", "WARM", "COLD", "FROZEN"] as const).map((seg, i) => {
              const colors = {
                HOT: "#ef4444",
                WARM: "#f59e0b",
                COLD: "#5b8def",
                FROZEN: "#94a3b8",
              };
              return (
                <StatCard
                  key={seg}
                  accent={colors[seg]}
                  label={seg}
                  value={data.segments[seg] || 0}
                  sub="leads"
                  delay={(i + 2) * 60}
                />
              );
            })}
          </div>

          {/* Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">
                By Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pipeline.byStatus.map((s, i) => (
                <BarRow
                  key={s.label}
                  label={s.label}
                  count={s.count}
                  max={Math.max(...data.pipeline.byStatus.map((x) => x.count), 1)}
                  delay={i * 40}
                  from="#5b8def"
                  to="#3b6fd4"
                />
              ))}
            </CardContent>
          </Card>

          {/* Source + Origin */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-500">
                  By Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.pipeline.bySource.slice(0, 10).map((s, i) => (
                  <BarRow
                    key={s.label}
                    label={s.label}
                    count={s.count}
                    max={Math.max(
                      ...data.pipeline.bySource.map((x) => x.count),
                      1,
                    )}
                    delay={i * 40}
                    from="#10b981"
                    to="#059669"
                  />
                ))}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-500">
                  By Origin Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.pipeline.byOriginType.slice(0, 10).map((o, i) => (
                  <BarRow
                    key={o.label}
                    label={o.label}
                    count={o.count}
                    max={Math.max(
                      ...data.pipeline.byOriginType.map((x) => x.count),
                      1,
                    )}
                    delay={i * 40}
                    from="#f59e0b"
                    to="#d97706"
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sales Reps table */}
          {data.pipeline.bySalesRep.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-500">
                  Top Sales Reps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          #
                        </th>
                        <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Sales Rep
                        </th>
                        <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Leads
                        </th>
                        <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Avg Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pipeline.bySalesRep.slice(0, 15).map((r, i) => (
                        <tr
                          key={r.label}
                          className="border-b border-slate-50"
                        >
                          <td className="py-2 text-xs text-slate-400">
                            {i + 1}
                          </td>
                          <td className="py-2 font-medium text-[#1a2332]">
                            {r.label}
                          </td>
                          <td
                            className="py-2 text-right tabular-nums"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {r.count}
                          </td>
                          <td
                            className="py-2 text-right tabular-nums text-slate-500"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {r.avgScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  accent,
  label,
  value,
  sub,
  delay,
}: {
  accent: string;
  label: string;
  value: string | number;
  sub: string;
  delay: number;
}) {
  return (
    <Card
      className="stat-card animate-fade-up border-0 shadow-sm"
      style={
        { "--stat-accent": accent, animationDelay: `${delay}ms` } as React.CSSProperties
      }
    >
      <CardContent className="py-4">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p
          className="mt-1 text-2xl font-bold text-[#1a2332]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BarRow({
  label,
  count,
  max,
  delay,
  from,
  to,
}: {
  label: string;
  count: number;
  max: number;
  delay: number;
  from: string;
  to: string;
}) {
  const pct = Math.max(2, Math.round((count / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs font-medium text-[#1a2332]">
        {label}
      </span>
      <div className="flex-1">
        <div className="h-5 overflow-hidden rounded bg-slate-50">
          <div
            className="funnel-bar h-full rounded"
            style={
              {
                width: `${pct}%`,
                "--bar-from": from,
                "--bar-to": to,
                animationDelay: `${delay}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
      <span
        className="w-10 text-right text-xs font-semibold tabular-nums text-[#1a2332]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {count}
      </span>
    </div>
  );
}
