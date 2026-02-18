"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, BarChart3, PieChart, FlaskConical } from "lucide-react";

interface AnalyticsData {
  channelStats: Record<string, Record<string, number>>;
  channelTotals: Record<string, number>;
  events: Record<string, number>;
  segments: Record<string, number>;
  variantCounts: { A: number; B: number; ai: number; fallback: number };
}

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
};

const channelColors: Record<string, { dot: string; bar: string; bg: string }> = {
  whatsapp: { dot: "bg-emerald-500", bar: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
  email: { dot: "bg-[#5b8def]", bar: "from-[#5b8def] to-[#3b6fd6]", bg: "bg-blue-50" },
  sms: { dot: "bg-amber-500", bar: "from-amber-500 to-amber-600", bg: "bg-amber-50" },
};

const segmentStyles: Record<string, { bar: string; dot: string }> = {
  HOT: { bar: "from-rose-500 to-rose-600", dot: "bg-rose-500" },
  WARM: { bar: "from-amber-500 to-amber-600", dot: "bg-amber-500" },
  COLD: { bar: "from-blue-500 to-blue-600", dot: "bg-blue-500" },
  FROZEN: { bar: "from-slate-400 to-slate-500", dot: "bg-slate-400" },
};

function pct(value: number, total: number): string {
  if (total === 0) return "0%";
  return ((value / total) * 100).toFixed(1) + "%";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2
          className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analytics
        </h2>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Failed to load analytics.
      </div>
    );
  }

  const totalTouches = Object.values(data.channelTotals).reduce((a, b) => a + b, 0);
  const totalSegments = Object.values(data.segments).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2
          className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analytics
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Campaign performance and conversion metrics
        </p>
      </div>

      {/* Channel Performance */}
      <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "80ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-[#5b8def]" />
            <CardTitle
              className="text-[15px] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Channel Performance
            </CardTitle>
          </div>
          <CardDescription className="text-[13px]">
            Conversion rates per delivery channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-3">
            {["whatsapp", "email", "sms"].map((channel) => {
              const stats = data.channelStats[channel] || {};
              const total = data.channelTotals[channel] || 0;
              const cc = channelColors[channel];
              const sent =
                (stats.sent || 0) +
                (stats.delivered || 0) +
                (stats.opened || 0) +
                (stats.clicked || 0) +
                (stats.replied || 0);
              const delivered =
                (stats.delivered || 0) +
                (stats.opened || 0) +
                (stats.clicked || 0) +
                (stats.replied || 0);
              const opened =
                (stats.opened || 0) +
                (stats.clicked || 0) +
                (stats.replied || 0);
              const replied = stats.replied || 0;
              const bounced = stats.bounced || 0;

              return (
                <div key={channel} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-9 items-center justify-center rounded-lg", cc.bg)}>
                      <div className={cn("size-3 rounded-full", cc.dot)} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#1a2332]">
                        {channelLabels[channel]}
                      </span>
                      <p
                        className="text-xs text-slate-400"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {total} total
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <MetricRow label="Sent" value={sent} total={total} />
                    <MetricRow label="Delivered" value={delivered} total={sent} />
                    <MetricRow label="Opened" value={opened} total={delivered} />
                    <MetricRow label="Replied" value={replied} total={opened} />
                    {bounced > 0 && (
                      <MetricRow label="Bounced" value={bounced} total={sent} isNegative />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Segment Distribution */}
        <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "160ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-[#5b8def]" />
              <CardTitle
                className="text-[15px] font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Lead Segments
              </CardTitle>
            </div>
            <CardDescription className="text-[13px]">Distribution across segments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["HOT", "WARM", "COLD", "FROZEN"].map((seg, i) => {
              const count = data.segments[seg] || 0;
              const width = totalSegments > 0 ? (count / totalSegments) * 100 : 0;
              const ss = segmentStyles[seg];

              return (
                <div key={seg} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", ss.dot)} />
                      <span className="font-semibold text-[#1a2332]">{seg}</span>
                    </div>
                    <span
                      className="text-slate-500 tabular-nums"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {count} ({pct(count, totalSegments)})
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("funnel-bar h-full rounded-full bg-gradient-to-r", ss.bar)}
                      style={{
                        width: `${Math.max(width, 1)}%`,
                        animationDelay: `${300 + i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* A/B Variant Performance */}
        <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "240ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[#5b8def]" />
              <CardTitle
                className="text-[15px] font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                A/B Testing
              </CardTitle>
            </div>
            <CardDescription className="text-[13px]">
              Variant distribution and AI vs fallback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-3 text-[13px] font-semibold text-[#1a2332]">Variant Split</p>
              <div className="flex gap-3">
                <VariantCard
                  label="Variant A"
                  subtitle="Direct & action-oriented"
                  count={data.variantCounts.A}
                  total={data.variantCounts.A + data.variantCounts.B}
                  color="#5b8def"
                />
                <VariantCard
                  label="Variant B"
                  subtitle="Casual & relationship-focused"
                  count={data.variantCounts.B}
                  total={data.variantCounts.A + data.variantCounts.B}
                  color="#8b5cf6"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-[13px] font-semibold text-[#1a2332]">Message Source</p>
              <div className="flex gap-3">
                <VariantCard
                  label="AI Generated"
                  subtitle="Claude API"
                  count={data.variantCounts.ai}
                  total={data.variantCounts.ai + data.variantCounts.fallback}
                  color="#10b981"
                />
                <VariantCard
                  label="Fallback"
                  subtitle="Template-based"
                  count={data.variantCounts.fallback}
                  total={data.variantCounts.ai + data.variantCounts.fallback}
                  color="#f59e0b"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  total,
  isNegative = false,
}: {
  label: string;
  value: number;
  total: number;
  isNegative?: boolean;
}) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className="font-semibold tabular-nums text-[#1a2332]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            isNegative
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function VariantCard({
  label,
  subtitle,
  count,
  total,
  color,
}: {
  label: string;
  subtitle: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : "0";

  return (
    <div className="flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <div
          className="size-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-bold text-[#1a2332]">{label}</span>
      </div>
      <p className="mt-1 text-[12px] text-slate-400">{subtitle}</p>
      <p
        className="mt-3 text-2xl font-bold tabular-nums text-[#1a2332]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {count}
        <span className="ml-1 text-xs font-normal text-slate-400">
          ({percentage}%)
        </span>
      </p>
    </div>
  );
}
