"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  Megaphone,
  Send,
  UserX,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  Activity,
} from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  optedOut: number;
  activeCampaigns: number;
  totalTouchesSent: number;
  funnel: {
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
  };
  activity: {
    id: string;
    eventType: string;
    channel: string;
    leadName: string;
    createdAt: string;
  }[];
}

const channelConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: "text-emerald-500", label: "WhatsApp" },
  email: { icon: Mail, color: "text-blue-500", label: "Email" },
  sms: { icon: Phone, color: "text-amber-500", label: "SMS" },
};

const eventLabels: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  replied: "Replied",
  bounced: "Bounced",
  failed: "Failed",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      accent: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Campaigns",
      value: stats.activeCampaigns,
      icon: Megaphone,
      accent: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Touches Sent",
      value: stats.totalTouchesSent,
      icon: Send,
      accent: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Opt-Outs",
      value: stats.optedOut,
      icon: UserX,
      accent: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  const { funnel } = stats;
  const funnelSteps = [
    { label: "Sent", value: funnel.sent, color: "bg-blue-500" },
    { label: "Delivered", value: funnel.delivered, color: "bg-emerald-500" },
    { label: "Opened", value: funnel.opened, color: "bg-amber-500" },
    { label: "Replied", value: funnel.replied, color: "bg-violet-500" },
  ];

  const maxFunnel = Math.max(funnel.sent, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          FAC Reactivation Engine — real-time campaign performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4">
              <div className={cn("flex size-10 items-center justify-center rounded-lg", card.bg)}>
                <card.icon className={cn("size-5", card.accent)} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel + Activity */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Funnel */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Delivery Funnel</CardTitle>
            <CardDescription>
              Touch progression across all campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelSteps.map((step, i) => {
              const pct = maxFunnel > 0 ? (step.value / maxFunnel) * 100 : 0;
              const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
              const convRate =
                prevValue && prevValue > 0
                  ? ((step.value / prevValue) * 100).toFixed(1)
                  : null;

              return (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.label}</span>
                      {convRate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ArrowRight className="size-3" />
                          {convRate}%
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {step.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", step.color)}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stats.activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent events</p>
            ) : (
              <div className="space-y-3">
                {stats.activity.map((event) => {
                  const ch = channelConfig[event.channel] ?? channelConfig.email;
                  const ChannelIcon = ch.icon;
                  const firstName = event.leadName.split(" ")[0];

                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <ChannelIcon className={cn("size-4 shrink-0", ch.color)} />
                      <div className="flex-1 truncate">
                        <span className="font-medium">{firstName}</span>
                        <span className="text-muted-foreground">
                          {" "}{eventLabels[event.eventType] ?? event.eventType}
                        </span>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {ch.label}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {timeAgo(event.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
