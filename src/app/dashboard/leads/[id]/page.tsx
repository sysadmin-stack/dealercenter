"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { parseAddress } from "@/lib/utils/address-parser";

interface LeadFull {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  address: string | null;
  dob: string | null;
  salesRep: string | null;
  source: string | null;
  originType: string | null;
  status: string | null;
  lostReason: string | null;
  creditApp: boolean;
  segment: string;
  language: string;
  score: number;
  daysOld: number | null;
  optedOut: boolean;
  tags: string[];
  importedYear: number | null;
  dealerCreatedAt: string | null;
  lastContacted: string | null;
  createdAt: string;
  touches?: {
    id: string;
    channel: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }[];
}

const segmentStyles: Record<string, { bg: string; text: string; dot: string }> = {
  HOT: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  WARM: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COLD: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  FROZEN: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawAddress, setShowRawAddress] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        }
      } catch {
        // Failed
      }
      setLoading(false);
    }
    fetchLead();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#1a2332]"
        >
          <ArrowLeft className="size-4" /> Back to Leads
        </Link>
        <p className="text-slate-500">Lead not found.</p>
      </div>
    );
  }

  const parsed = parseAddress(lead.address);
  const seg = segmentStyles[lead.segment] || segmentStyles.COLD;
  const age = lead.dob ? calculateAge(lead.dob) : null;
  const scorePercent = Math.min(100, Math.round((lead.score / 120) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <Link
          href="/dashboard/leads"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-[#1a2332]"
        >
          <ArrowLeft className="size-4" /> Back to Leads
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#1b2a4a]">
            <User className="size-6 text-white" />
          </div>
          <div>
            <h2
              className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {lead.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  seg.bg,
                  seg.text,
                )}
              >
                <span className={cn("size-1.5 rounded-full", seg.dot)} />
                {lead.segment}
              </span>
              {lead.optedOut && (
                <Badge variant="destructive" className="text-[10px]">
                  Opted Out
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card
          className="animate-fade-up border-0 shadow-sm"
          style={{ animationDelay: "80ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                {parsed.city ? (
                  <>
                    <p className="text-sm font-medium text-[#1a2332]">
                      {parsed.city}, {parsed.state} {parsed.zip}
                    </p>
                    {parsed.street && (
                      <p className="text-xs text-slate-500">{parsed.street}</p>
                    )}
                    <button
                      onClick={() => setShowRawAddress(!showRawAddress)}
                      className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      {showRawAddress ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                      Raw
                    </button>
                    {showRawAddress && (
                      <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-400">
                        {parsed.raw}
                      </p>
                    )}
                  </>
                ) : parsed.raw ? (
                  <p className="text-sm text-slate-500">{parsed.raw}</p>
                ) : (
                  <p className="text-sm text-slate-400">No address</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-slate-400" />
              <div>
                <p
                  className="text-sm tabular-nums text-[#1a2332]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {lead.phone || "—"}
                </p>
                {lead.phoneSecondary && (
                  <p
                    className="text-xs tabular-nums text-slate-500"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {lead.phoneSecondary}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-slate-400" />
              <p className="truncate text-sm text-[#1a2332]">
                {lead.email || "—"}
              </p>
            </div>

            {/* DOB / Age */}
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-slate-400" />
              <p className="text-sm text-[#1a2332]">
                {lead.dob ? (
                  <>
                    {formatDate(lead.dob)}
                    {age !== null && (
                      <span className="ml-1 text-slate-500">({age} yrs)</span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>

            {/* Language */}
            <div className="flex items-center gap-3">
              <span className="flex size-4 items-center justify-center text-xs text-slate-400">
                {lead.language}
              </span>
              <p className="text-sm text-[#1a2332]">
                {lead.language === "EN"
                  ? "English"
                  : lead.language === "PT"
                    ? "Portuguese"
                    : lead.language === "ES"
                      ? "Spanish"
                      : lead.language}
              </p>
            </div>

            {/* Tags */}
            {lead.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 size-4 text-slate-400" />
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-slate-200 text-[10px] text-slate-500"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card
          className="animate-fade-up border-0 shadow-sm"
          style={{ animationDelay: "160ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Lead Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Status" value={lead.status || "—"} />
            <Row label="Source" value={lead.source || "—"} />
            <Row label="Origin Type" value={lead.originType || "—"} />
            <Row label="Sales Rep" value={lead.salesRep || "—"} />
            <Row
              label="Lost Reason"
              value={lead.lostReason || "—"}
              dim={!lead.lostReason}
            />
            <Row
              label="Credit App"
              value={lead.creditApp ? "Yes" : "No"}
              accent={lead.creditApp}
            />
            <Row
              label="Days Old"
              value={lead.daysOld != null ? String(lead.daysOld) : "—"}
            />

            {/* Score bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Score</span>
                <span
                  className="text-sm font-bold tabular-nums text-[#1a2332]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {lead.score}
                  <span className="text-xs font-normal text-slate-400">/120</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="funnel-bar h-full rounded-full"
                  style={{
                    width: `${scorePercent}%`,
                    "--bar-from": "#5b8def",
                    "--bar-to": "#3b6fd4",
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card
          className="animate-fade-up border-0 shadow-sm"
          style={{ animationDelay: "240ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TimelineRow
              icon={<Calendar className="size-3.5" />}
              label="Dealer Created"
              value={formatDate(lead.dealerCreatedAt)}
            />
            <TimelineRow
              icon={<Clock className="size-3.5" />}
              label="Last Contacted"
              value={formatDate(lead.lastContacted)}
            />
            <TimelineRow
              icon={<Calendar className="size-3.5" />}
              label="Imported"
              value={
                lead.importedYear ? String(lead.importedYear) : "—"
              }
            />
            <TimelineRow
              icon={<Clock className="size-3.5" />}
              label="Added to CRM"
              value={formatDate(lead.createdAt)}
            />

            {/* Recent touches */}
            {lead.touches && lead.touches.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recent Touches
                </p>
                <div className="space-y-2">
                  {lead.touches.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {t.channel}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            t.status === "delivered"
                              ? "text-emerald-600"
                              : t.status === "failed"
                                ? "text-rose-600"
                                : "text-slate-500",
                          )}
                        >
                          {t.status}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {formatDate(t.sentAt || t.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  dim,
  accent,
}: {
  label: string;
  value: string;
  dim?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span
        className={cn(
          "text-sm font-medium",
          dim ? "text-slate-400" : accent ? "text-emerald-600" : "text-[#1a2332]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm font-medium text-[#1a2332]">{value}</p>
      </div>
    </div>
  );
}
