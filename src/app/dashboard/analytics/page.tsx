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
import { Loader2 } from "lucide-react";

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

const channelColors: Record<string, string> = {
  whatsapp: "bg-emerald-500",
  email: "bg-blue-500",
  sms: "bg-amber-500",
};

const segmentColors: Record<string, string> = {
  HOT: "bg-rose-500",
  WARM: "bg-amber-500",
  COLD: "bg-blue-500",
  FROZEN: "bg-slate-400",
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
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Failed to load analytics.
      </div>
    );
  }

  const totalTouches = Object.values(data.channelTotals).reduce((a, b) => a + b, 0);
  const totalSegments = Object.values(data.segments).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Campaign performance and conversion metrics
        </p>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel Performance</CardTitle>
          <CardDescription>Conversion rates per delivery channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {["whatsapp", "email", "sms"].map((channel) => {
              const stats = data.channelStats[channel] || {};
              const total = data.channelTotals[channel] || 0;
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
                <div key={channel} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-3 rounded-full", channelColors[channel])} />
                    <span className="text-sm font-semibold">
                      {channelLabels[channel]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {total} total
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Segments</CardTitle>
            <CardDescription>Distribution across segments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["HOT", "WARM", "COLD", "FROZEN"].map((seg) => {
              const count = data.segments[seg] || 0;
              const width = totalSegments > 0 ? (count / totalSegments) * 100 : 0;

              return (
                <div key={seg} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{seg}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {count} ({pct(count, totalSegments)})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", segmentColors[seg])}
                      style={{ width: `${Math.max(width, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* A/B Variant Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">A/B Testing</CardTitle>
            <CardDescription>Variant distribution and AI vs fallback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Variant Split</p>
              <div className="flex gap-3">
                <VariantCard
                  label="Variant A"
                  subtitle="Direct & action-oriented"
                  count={data.variantCounts.A}
                  total={data.variantCounts.A + data.variantCounts.B}
                  color="bg-blue-500"
                />
                <VariantCard
                  label="Variant B"
                  subtitle="Casual & relationship-focused"
                  count={data.variantCounts.B}
                  total={data.variantCounts.A + data.variantCounts.B}
                  color="bg-violet-500"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Message Source</p>
              <div className="flex gap-3">
                <VariantCard
                  label="AI Generated"
                  subtitle="Claude API"
                  count={data.variantCounts.ai}
                  total={data.variantCounts.ai + data.variantCounts.fallback}
                  color="bg-emerald-500"
                />
                <VariantCard
                  label="Fallback"
                  subtitle="Template-based"
                  count={data.variantCounts.fallback}
                  total={data.variantCounts.ai + data.variantCounts.fallback}
                  color="bg-amber-500"
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
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-nums">{value}</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] tabular-nums",
            isNegative && "text-rose-500",
          )}
        >
          {percentage}%
        </Badge>
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
    <div className="flex-1 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", color)} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <p className="mt-2 text-lg font-bold tabular-nums">
        {count}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          ({percentage}%)
        </span>
      </p>
    </div>
  );
}
