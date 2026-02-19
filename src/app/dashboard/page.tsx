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
  TrendingUp,
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

const channelConfig: Record<
  string,
  { icon: typeof MessageSquare; color: string; bg: string; label: string }
> = {
  whatsapp: { icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50", label: "WhatsApp" },
  email: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50", label: "Email" },
  sms: { icon: Phone, color: "text-amber-600", bg: "bg-amber-50", label: "SMS" },
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
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch stats");
        return r.json();
      })
      .then((data) => {
        if (data && typeof data.totalLeads === "number") {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Overview
          </h2>
          <p className="mt-2 text-sm text-slate-500">Loading dashboard...</p>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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
      <div className="flex h-64 items-center justify-center text-slate-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      accent: "#5b8def",
      iconBg: "bg-blue-50",
      iconColor: "text-[#5b8def]",
    },
    {
      label: "Active Campaigns",
      value: stats.activeCampaigns,
      icon: Megaphone,
      accent: "#10b981",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Touches Sent",
      value: stats.totalTouchesSent,
      icon: Send,
      accent: "#8b5cf6",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Opt-Outs",
      value: stats.optedOut,
      icon: UserX,
      accent: "#ef4444",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  const { funnel } = stats;
  const funnelSteps = [
    { label: "Sent", value: funnel.sent, from: "#5b8def", to: "#3b6fd6" },
    { label: "Delivered", value: funnel.delivered, from: "#10b981", to: "#059669" },
    { label: "Opened", value: funnel.opened, from: "#f59e0b", to: "#d97706" },
    { label: "Replied", value: funnel.replied, from: "#8b5cf6", to: "#7c3aed" },
  ];

  const maxFunnel = Math.max(funnel.sent, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h2
          className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Overview
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          FAC Reactivation Engine — real-time campaign performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card
            key={card.label}
            className="stat-card animate-fade-up border-0 shadow-sm"
            style={
              {
                "--stat-accent": card.accent,
                animationDelay: `${i * 80}ms`,
              } as React.CSSProperties
            }
          >
            <CardContent className="flex items-center gap-4 py-5">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl",
                  card.iconBg,
                )}
              >
                <card.icon className={cn("size-6", card.iconColor)} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold tabular-nums tracking-tight text-[#1a2332]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {card.value.toLocaleString()}
                </p>
                <p className="text-[13px] text-slate-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel + Activity */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Funnel */}
        <Card
          className="animate-fade-up border-0 shadow-sm lg:col-span-3"
          style={{ animationDelay: "320ms" }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[#5b8def]" />
              <CardTitle
                className="text-[15px] font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Delivery Funnel
              </CardTitle>
            </div>
            <CardDescription className="text-[13px]">
              Touch progression across all campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {funnelSteps.map((step, i) => {
              const pct = maxFunnel > 0 ? (step.value / maxFunnel) * 100 : 0;
              const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
              const convRate =
                prevValue && prevValue > 0
                  ? ((step.value / prevValue) * 100).toFixed(1)
                  : null;

              return (
                <div key={step.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1a2332]">{step.label}</span>
                      {convRate && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <ArrowRight className="size-3" />
                          {convRate}%
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums text-[#1a2332]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {step.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="funnel-bar h-full rounded-full"
                      style={
                        {
                          width: `${Math.max(pct, 2)}%`,
                          "--bar-from": step.from,
                          "--bar-to": step.to,
                          animationDelay: `${400 + i * 150}ms`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card
          className="animate-fade-up border-0 shadow-sm lg:col-span-2"
          style={{ animationDelay: "400ms" }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#5b8def]" />
              <CardTitle
                className="text-[15px] font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stats.activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No recent events</p>
            ) : (
              <div className="space-y-1">
                {stats.activity.map((event, i) => {
                  const ch = channelConfig[event.channel] ?? channelConfig.email;
                  const ChannelIcon = ch.icon;
                  const firstName = event.leadName.split(" ")[0];

                  return (
                    <div
                      key={event.id}
                      className="animate-slide-left flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-slate-50"
                      style={{ animationDelay: `${500 + i * 60}ms` }}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          ch.bg,
                        )}
                      >
                        <ChannelIcon className={cn("size-4", ch.color)} />
                      </div>
                      <div className="flex-1 truncate">
                        <span className="font-semibold text-[#1a2332]">{firstName}</span>
                        <span className="text-slate-500">
                          {" "}{eventLabels[event.eventType] ?? event.eventType}
                        </span>
                      </div>
                      <span
                        className="shrink-0 text-xs text-slate-400 tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
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
