"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Zap,
} from "lucide-react";

interface Touch {
  id: string;
  channel: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  lead: { name: string };
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  segments: string[];
  channels: string[];
  status: string;
  startDate: string | null;
  createdAt: string;
  touches: Touch[];
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const touchStatusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-slate-100", text: "text-slate-600" },
  sent: { bg: "bg-blue-50", text: "text-blue-700" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700" },
  opened: { bg: "bg-amber-50", text: "text-amber-700" },
  clicked: { bg: "bg-violet-50", text: "text-violet-700" },
  replied: { bg: "bg-emerald-50", text: "text-emerald-700" },
  bounced: { bg: "bg-rose-50", text: "text-rose-700" },
  failed: { bg: "bg-rose-50", text: "text-rose-700" },
};

const channelLabels: Record<string, string> = {
  whatsapp: "WA",
  email: "Email",
  sms: "SMS",
};

const statCardConfig: Record<string, { color: string; icon: string }> = {
  pending: { color: "#94a3b8", icon: "bg-slate-50" },
  sent: { color: "#5b8def", icon: "bg-blue-50" },
  delivered: { color: "#10b981", icon: "bg-emerald-50" },
  opened: { color: "#f59e0b", icon: "bg-amber-50" },
  clicked: { color: "#8b5cf6", icon: "bg-violet-50" },
  replied: { color: "#10b981", icon: "bg-emerald-50" },
  bounced: { color: "#ef4444", icon: "bg-rose-50" },
  failed: { color: "#ef4444", icon: "bg-rose-50" },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        setCampaign(await res.json());
      }
    } catch {
      // Failed
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  async function handleAction(action: string) {
    setActionLoading(true);
    try {
      await fetch(`/api/campaigns/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchCampaign();
    } catch {
      // Failed
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-slate-500">Campaign not found</p>
        <Link href="/dashboard/campaigns">
          <Button variant="outline" size="sm" className="border-slate-200">
            Back to campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const touchStats: Record<string, number> = {};
  for (const t of campaign.touches) {
    touchStats[t.status] = (touchStats[t.status] || 0) + 1;
  }

  const st = statusConfig[campaign.status] || statusConfig.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-[#1a2332]">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="text-2xl font-bold tracking-tight text-[#1a2332]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {campaign.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                  st.bg,
                  st.text,
                )}
              >
                <span className={cn("size-1.5 rounded-full", st.dot)} />
                {campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-slate-500">{campaign.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Button
              onClick={() => handleAction("activate")}
              disabled={actionLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Activate
            </Button>
          )}
          {campaign.status === "active" && (
            <Button
              variant="outline"
              onClick={() => handleAction("pause")}
              disabled={actionLoading}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pause className="size-4" />
              )}
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <>
              <Button
                onClick={() => handleAction("resume")}
                disabled={actionLoading}
                className="bg-[#5b8def] text-white hover:bg-[#4a7cd6]"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Resume
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("cancel")}
                disabled={actionLoading}
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <Square className="size-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Config badges */}
      <div className="animate-fade-up flex flex-wrap gap-2" style={{ animationDelay: "80ms" }}>
        {campaign.segments.map((s) => (
          <Badge key={s} variant="outline" className="border-slate-200 text-xs font-semibold text-slate-500">
            {s}
          </Badge>
        ))}
        {campaign.channels.map((c) => (
          <Badge
            key={c}
            variant="outline"
            className="border-blue-100 bg-blue-50/50 text-xs font-semibold text-blue-600"
          >
            {channelLabels[c] || c}
          </Badge>
        ))}
      </div>

      {/* Touch Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {["pending", "sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"].map(
          (status, i) => {
            const config = statCardConfig[status] || statCardConfig.pending;
            return (
              <Card
                key={status}
                className="stat-card animate-fade-up border-0 shadow-sm"
                style={
                  {
                    "--stat-accent": config.color,
                    animationDelay: `${160 + i * 40}ms`,
                  } as React.CSSProperties
                }
              >
                <CardContent className="py-4 text-center">
                  <p
                    className="text-xl font-bold tabular-nums text-[#1a2332]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {touchStats[status] || 0}
                  </p>
                  <p className="text-[11px] capitalize text-slate-500">{status}</p>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {/* Touches list */}
      <Card
        className="animate-fade-up border-0 shadow-sm"
        style={{ animationDelay: "480ms" }}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-[#5b8def]" />
            <CardTitle
              className="text-[15px] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Touches
            </CardTitle>
          </div>
          <CardDescription className="text-[13px]">
            {campaign.touches.length} total touches scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.touches.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Clock className="size-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No touches yet. Activate the campaign to schedule touches.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-1.5 overflow-y-auto">
              {campaign.touches.slice(0, 50).map((touch) => {
                const ts = touchStatusConfig[touch.status] || touchStatusConfig.pending;
                return (
                  <div
                    key={touch.id}
                    className="table-row-hover flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-sm"
                  >
                    <Badge
                      variant="outline"
                      className="border-blue-100 bg-blue-50/50 text-[10px] font-semibold text-blue-600"
                    >
                      {channelLabels[touch.channel] || touch.channel}
                    </Badge>
                    <span className="flex-1 truncate font-medium text-[#1a2332]">
                      {touch.lead.name}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        ts.bg,
                        ts.text,
                      )}
                    >
                      {touch.status}
                    </span>
                    <span
                      className="text-xs text-slate-400 tabular-nums"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {touch.scheduledAt
                        ? new Date(touch.scheduledAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                );
              })}
              {campaign.touches.length > 50 && (
                <p className="pt-2 text-center text-xs text-slate-400">
                  Showing 50 of {campaign.touches.length} touches
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
