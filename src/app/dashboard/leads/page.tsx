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

const segmentColors: Record<string, string> = {
  HOT: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  WARM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  COLD: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  FROZEN: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");
  const [language, setLanguage] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()} total leads
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
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

      {/* Upload drop zone + result */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20",
          uploadResult ? "pb-2" : "",
        )}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Importing leads...
          </div>
        ) : (
          <p className="text-muted-foreground">
            Drag & drop a DealerCenter XLSX file here, or use the button above
          </p>
        )}
        {uploadResult && (
          <div
            className={cn(
              "mt-2 flex items-center justify-center gap-2 text-sm",
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="PT">Portuguese</SelectItem>
            <SelectItem value="ES">Spanish</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.name}
                      {lead.optedOut && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Opted Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="tabular-nums">{lead.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", segmentColors[lead.segment])}
                      >
                        {lead.segment}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">{lead.score}</TableCell>
                    <TableCell>{lead.language}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                      {lead.salesRep || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
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
