"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Snowflake,
  Users,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string;
  language: string;
  score: number;
  status: string | null;
  salesRep: string | null;
  optedOut: boolean;
  tags: string[];
  createdAt: string;
}

interface LeadsResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const segmentStyles: Record<string, { bg: string; text: string; dot: string }> = {
  HOT: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  WARM: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COLD: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  FROZEN: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");
  const [language, setLanguage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [frozenCount, setFrozenCount] = useState<number | null>(null);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (segment) params.set("segment", segment);
      if (language) params.set("language", language);

      try {
        const res = await fetch(`/api/leads?${params}`);
        const data: LeadsResponse = await res.json();
        setLeads(data.data);
        setPagination(data.pagination);
      } catch {
        // Failed to fetch
      }
      setLoading(false);
    },
    [search, segment, language],
  );

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/leads?segment=FROZEN&limit=1")
      .then((r) => r.json())
      .then((d) => setFrozenCount(d.pagination?.total ?? null))
      .catch(() => {});
  }, []);

  async function handleMetaExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/leads/export/meta-audience?segment=FROZEN");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || "meta-audience.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failed
    }
    setExporting(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        setUploadResult({
          success: true,
          message: `Imported ${data.created} leads (${data.updated} updated, ${data.skipped} skipped)`,
        });
        fetchLeads(1);
      } else {
        setUploadResult({ success: false, message: data.error || "Import failed" });
      }
    } catch {
      setUploadResult({ success: false, message: "Network error" });
    }
    setUploading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".xlsx")) handleUpload(file);
  }

  function clearFilters() {
    setSearch("");
    setSegment("");
    setLanguage("");
  }

  const hasFilters = search || segment || language;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Leads
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="size-3.5" />
            {pagination.total.toLocaleString()} total leads
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-[#1b2a4a] text-white hover:bg-[#243656]"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Import XLSX
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "animate-fade-up rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all duration-200",
          dragOver
            ? "border-[#5b8def] bg-blue-50/50"
            : "border-slate-200 bg-white",
        )}
        style={{ animationDelay: "80ms" }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Importing leads...
          </div>
        ) : (
          <p className="text-slate-400">
            Drag & drop a DealerCenter XLSX file here, or use the button above
          </p>
        )}
        {uploadResult && (
          <div
            className={cn(
              "mt-3 flex items-center justify-center gap-2 text-sm font-medium",
              uploadResult.success ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {uploadResult.success ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {uploadResult.message}
          </div>
        )}
      </div>

      {/* Meta Ads Export Card */}
      {frozenCount !== null && frozenCount > 0 && (
        <Card className="animate-fade-up border-0 shadow-sm" style={{ animationDelay: "160ms" }}>
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                <Snowflake className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a2332]">
                  FROZEN Leads — Meta Ads Export
                </p>
                <p className="text-[13px] text-slate-500">
                  <span className="font-semibold text-[#1a2332]">{frozenCount.toLocaleString()}</span> leads
                  {" · "}Est. match: ~{Math.round(frozenCount * 0.65).toLocaleString()}
                  {" · "}SHA-256 hashed CSV
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleMetaExport}
              disabled={exporting}
              className="border-slate-200"
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div
        className="animate-fade-up flex flex-wrap items-center gap-3"
        style={{ animationDelay: "240ms" }}
      >
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-200 bg-white pl-9"
          />
        </div>
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-[140px] border-slate-200 bg-white">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOT">HOT</SelectItem>
            <SelectItem value="WARM">WARM</SelectItem>
            <SelectItem value="COLD">COLD</SelectItem>
            <SelectItem value="FROZEN">FROZEN</SelectItem>
          </SelectContent>
        </Select>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[140px] border-slate-200 bg-white">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="PT">Portuguese</SelectItem>
            <SelectItem value="ES">Spanish</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card
        className="animate-fade-up overflow-hidden border-0 shadow-sm"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/80">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Contact
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Segment
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Language
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Sales Rep
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Tags
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  const seg = segmentStyles[lead.segment] || segmentStyles.COLD;
                  return (
                    <TableRow key={lead.id} className="table-row-hover border-slate-100">
                      <TableCell className="font-medium text-[#1a2332]">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="hover:text-[#5b8def] hover:underline"
                        >
                          {lead.name}
                        </Link>
                        {lead.optedOut && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">
                            Opted Out
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs text-slate-500">
                          {lead.email && <div>{lead.email}</div>}
                          {lead.phone && (
                            <div className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-semibold tabular-nums text-[#1a2332]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {lead.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{lead.language}</span>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-xs text-slate-500">
                        {lead.salesRep || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-slate-200 text-[10px] text-slate-500"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
              className="border-slate-200"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
              className="border-slate-200"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
