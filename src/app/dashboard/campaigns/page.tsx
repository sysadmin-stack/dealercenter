"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Loader2, Megaphone, Calendar } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  segments: string[];
  channels: string[];
  status: string;
  startDate: string | null;
  createdAt: string;
  _count?: { touches: number };
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Campaigns
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage your outreach campaigns
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-[#5b8def] text-white hover:bg-[#4a7cd6]">
            <Plus className="size-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
              <Megaphone className="size-7 text-[#5b8def]" />
            </div>
            <p className="mt-4 font-semibold text-[#1a2332]">No campaigns yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first outreach campaign</p>
            <Link href="/dashboard/campaigns/new" className="mt-4">
              <Button className="bg-[#5b8def] text-white hover:bg-[#4a7cd6]">
                <Plus className="size-4" />
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign, i) => {
            const st = statusConfig[campaign.status] || statusConfig.draft;
            return (
              <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
                <Card
                  className="card-hover animate-fade-up cursor-pointer border-0 shadow-sm"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle
                        className="text-[15px] font-bold text-[#1a2332]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {campaign.name}
                      </CardTitle>
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
                      <p className="text-[13px] text-slate-500 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.segments.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="border-slate-200 text-[10px] font-semibold text-slate-500"
                        >
                          {s}
                        </Badge>
                      ))}
                      {campaign.channels.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="border-blue-100 bg-blue-50/50 text-[10px] font-semibold text-blue-600"
                        >
                          {channelLabels[c] || c}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="size-3" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
