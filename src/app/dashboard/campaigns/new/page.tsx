"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Eye, Sparkles } from "lucide-react";
import Link from "next/link";

const SEGMENTS = ["HOT", "WARM", "COLD", "FROZEN"] as const;
const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
] as const;

const segmentAccent: Record<string, string> = {
  HOT: "border-rose-400 bg-rose-50 text-rose-700",
  WARM: "border-amber-400 bg-amber-50 text-amber-700",
  COLD: "border-blue-400 bg-blue-50 text-blue-700",
  FROZEN: "border-slate-300 bg-slate-100 text-slate-600",
};

interface PreviewResult {
  totalLeads: number;
  bySegment: Record<string, number>;
  byChannel: Record<string, number>;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState("");

  function toggleSegment(s: string) {
    setSegments((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setPreview(null);
  }

  function toggleChannel(c: string) {
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
    setPreview(null);
  }

  async function handlePreview() {
    if (segments.length === 0 || channels.length === 0) return;
    setPreviewing(true);

    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Preview Draft",
          description,
          segments,
          channels,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create draft");
      const campaign = await createRes.json();

      const previewRes = await fetch(`/api/campaigns/${campaign.id}/preview`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      const data = await previewRes.json();
      if (data && typeof data.totalLeads === "number") {
        setPreview(data);
      } else {
        setError("Preview returned unexpected data");
      }

      if (!name) {
        await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      }
    } catch {
      setError("Failed to preview");
    }
    setPreviewing(false);
  }

  async function handleCreate() {
    if (!name || segments.length === 0 || channels.length === 0) {
      setError("Fill in name, select at least one segment and one channel");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, segments, channels }),
      });

      if (res.ok) {
        const campaign = await res.json();
        router.push(`/dashboard/campaigns/${campaign.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create campaign");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up flex items-center gap-3">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-[#1a2332]">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            New Campaign
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure segments and channels
          </p>
        </div>
      </div>

      <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "80ms" }}>
        <CardHeader>
          <CardTitle
            className="text-[15px] font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1a2332]">Name</label>
            <Input
              placeholder="e.g. Q1 2026 Hot Lead Reactivation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1a2332]">Description</label>
            <Input
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-slate-200 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "160ms" }}>
        <CardHeader>
          <CardTitle
            className="text-[15px] font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Target Segments
          </CardTitle>
          <CardDescription className="text-[13px]">Select which lead segments to include</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSegment(s)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-all duration-200",
                  segments.includes(s)
                    ? segmentAccent[s]
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle
            className="text-[15px] font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Channels
          </CardTitle>
          <CardDescription className="text-[13px]">Select delivery channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleChannel(c.value)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-all duration-200",
                  channels.includes(c.value)
                    ? "border-[#5b8def] bg-blue-50 text-[#3b6fd6]"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="animate-fade-up border-0 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2 text-[15px] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <Sparkles className="size-4 text-[#5b8def]" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-bold text-[#1a2332]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {preview.totalLeads.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">eligible leads</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(preview.bySegment || {}).map(([seg, count]) => (
                <Badge
                  key={seg}
                  variant="outline"
                  className="border-slate-200 text-xs"
                >
                  {seg}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      )}

      <div className="animate-fade-up flex gap-3" style={{ animationDelay: "320ms" }}>
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={segments.length === 0 || channels.length === 0 || previewing}
          className="border-slate-200"
        >
          {previewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Preview Leads
        </Button>
        <Button
          onClick={handleCreate}
          disabled={saving}
          className="bg-[#5b8def] text-white hover:bg-[#4a7cd6]"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Create Campaign
        </Button>
      </div>
    </div>
  );
}
