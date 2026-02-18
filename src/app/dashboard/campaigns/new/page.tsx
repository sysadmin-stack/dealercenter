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
import { ArrowLeft, Loader2, Eye } from "lucide-react";
import Link from "next/link";

const SEGMENTS = ["HOT", "WARM", "COLD", "FROZEN"] as const;
const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
] as const;

interface PreviewResult {
  eligible: number;
  bySegment: Record<string, number>;
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

    // First create as draft, then preview
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
      const campaign = await createRes.json();

      const previewRes = await fetch(`/api/campaigns/${campaign.id}/preview`);
      const data = await previewRes.json();
      setPreview(data);

      // Clean up: delete the draft if it was just for preview
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
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">New Campaign</h2>
          <p className="text-sm text-muted-foreground">
            Configure segments and channels
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. Q1 2026 Hot Lead Reactivation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <Input
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Segments</CardTitle>
          <CardDescription>Select which lead segments to include</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSegment(s)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  segments.includes(s)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channels</CardTitle>
          <CardDescription>Select delivery channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleChannel(c.value)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  channels.includes(c.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{preview.eligible.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">eligible leads</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(preview.bySegment || {}).map(([seg, count]) => (
                <Badge key={seg} variant="outline">
                  {seg}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={segments.length === 0 || channels.length === 0 || previewing}
        >
          {previewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Preview Leads
        </Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Create Campaign
        </Button>
      </div>
    </div>
  );
}
