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

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const touchStatusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600",
  delivered: "bg-emerald-500/15 text-emerald-600",
  opened: "bg-amber-500/15 text-amber-600",
  clicked: "bg-violet-500/15 text-violet-600",
  replied: "bg-emerald-500/15 text-emerald-600",
  bounced: "bg-rose-500/15 text-rose-600",
  failed: "bg-rose-500/15 text-rose-600",
};

const channelLabels: Record<string, string> = {
  whatsapp: "WA",
  email: "Email",
  sms: "SMS",
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
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/dashboard/campaigns">
          <Button variant="outline" size="sm">Back to campaigns</Button>
        </Link>
      </div>
    );
  }

  // Touch stats
  const touchStats: Record<string, number> = {};
  for (const t of campaign.touches) {
    touchStats[t.status] = (touchStats[t.status] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {campaign.name}
              </h2>
              <Badge
                variant="secondary"
                className={cn("capitalize", statusStyles[campaign.status])}
              >
                {campaign.status}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground">
                {campaign.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Button
              onClick={() => handleAction("activate")}
              disabled={actionLoading}
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
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Resume
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction("cancel")}
                disabled={actionLoading}
              >
                <Square className="size-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Config badges */}
      <div className="flex flex-wrap gap-2">
        {campaign.segments.map((s) => (
          <Badge key={s} variant="outline">{s}</Badge>
        ))}
        {campaign.channels.map((c) => (
          <Badge key={c} variant="outline">{channelLabels[c] || c}</Badge>
        ))}
      </div>

      {/* Touch Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {["pending", "sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"].map(
          (status) => (
            <Card key={status}>
              <CardContent className="text-center">
                <p className="text-xl font-bold tabular-nums">
                  {touchStats[status] || 0}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{status}</p>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {/* Touches list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Touches</CardTitle>
          <CardDescription>
            {campaign.touches.length} total touches scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.touches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No touches yet. Activate the campaign to schedule touches.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {campaign.touches.slice(0, 50).map((touch) => (
                <div
                  key={touch.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <Badge variant="outline" className="text-[10px]">
                    {channelLabels[touch.channel] || touch.channel}
                  </Badge>
                  <span className="flex-1 truncate font-medium">
                    {touch.lead.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] capitalize", touchStatusStyles[touch.status])}
                  >
                    {touch.status}
                  </Badge>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {touch.scheduledAt
                      ? new Date(touch.scheduledAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              ))}
              {campaign.touches.length > 50 && (
                <p className="text-center text-xs text-muted-foreground">
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
