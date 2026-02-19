"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Plus,
  X,
  Download,
  BarChart3,
  TableIcon,
  Loader2,
} from "lucide-react";

const GROUP_OPTIONS = [
  { value: "salesRep", label: "Sales Rep" },
  { value: "source", label: "Source" },
  { value: "segment", label: "Segment" },
  { value: "language", label: "Language" },
  { value: "status", label: "Status" },
  { value: "originType", label: "Origin Type" },
  { value: "importedYear", label: "Import Year" },
  { value: "city", label: "City" },
  { value: "zip", label: "ZIP Code" },
  { value: "scoreRange", label: "Score Range" },
  { value: "ageGroup", label: "Age Group" },
];

interface Filter {
  field: string;
  value: string;
}

interface ReportRow {
  label: string;
  count: number;
  avgScore: number;
  avgDaysOld: number;
}

const FILTER_FIELDS = [
  { value: "segment", label: "Segment", type: "select", options: ["HOT", "WARM", "COLD", "FROZEN"] },
  { value: "language", label: "Language", type: "select", options: ["EN", "PT", "ES"] },
  { value: "status", label: "Status", type: "text" },
  { value: "salesRep", label: "Sales Rep", type: "text" },
  { value: "source", label: "Source", type: "text" },
  { value: "creditApp", label: "Credit App", type: "select", options: ["true", "false"] },
  { value: "optedOut", label: "Opted Out", type: "select", options: ["true", "false"] },
  { value: "importedYear", label: "Import Year", type: "text" },
  { value: "scoreMin", label: "Score Min", type: "text" },
  { value: "scoreMax", label: "Score Max", type: "text" },
  { value: "daysOldMin", label: "Days Old Min", type: "text" },
  { value: "daysOldMax", label: "Days Old Max", type: "text" },
];

function ReportBuilderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [groupBy, setGroupBy] = useState(searchParams.get("groupBy") || "segment");
  const [filters, setFilters] = useState<Filter[]>(() => {
    const initial: Filter[] = [];
    searchParams.forEach((value, key) => {
      if (key !== "groupBy") {
        initial.push({ field: key, value });
      }
    });
    return initial;
  });
  const [viewMode, setViewMode] = useState<"bar" | "table">("bar");
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFilterField, setNewFilterField] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("groupBy", groupBy);
    for (const f of filters) {
      params.set(f.field, f.value);
    }
    return params;
  }, [groupBy, filters]);

  // Sync URL
  useEffect(() => {
    const params = buildParams();
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [buildParams, router]);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    const params = buildParams();
    fetch(`/api/leads/report?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [buildParams]);

  function addFilter() {
    if (!newFilterField || !newFilterValue) return;
    setFilters((prev) => [...prev, { field: newFilterField, value: newFilterValue }]);
    setNewFilterField("");
    setNewFilterValue("");
    setDialogOpen(false);
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleExport() {
    const params = buildParams();
    const res = await fetch(`/api/leads/report/export?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ||
      "report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxCount = Math.max(...data.map((r) => r.count), 1);
  const selectedFilterDef = FILTER_FIELDS.find((f) => f.value === newFilterField);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <Link
          href="/dashboard/intelligence"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-[#1a2332]"
        >
          <ArrowLeft className="size-4" /> Back to Intelligence
        </Link>
        <div className="flex items-center justify-between">
          <h2
            className="page-title text-2xl font-bold tracking-tight text-[#1a2332]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Report Builder
          </h2>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={data.length === 0}
            className="border-slate-200"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card
        className="animate-fade-up border-0 shadow-sm"
        style={{ animationDelay: "80ms" }}
      >
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Group By */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Group by</span>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[160px] border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Active filters */}
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((f, i) => (
                <Badge
                  key={`${f.field}-${i}`}
                  variant="secondary"
                  className="gap-1 bg-blue-50 text-blue-700"
                >
                  {f.field}: {f.value}
                  <button onClick={() => removeFilter(i)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}

              {/* Add filter */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-dashed border-slate-300 text-slate-500">
                    <Plus className="size-3.5" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Filter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={newFilterField} onValueChange={(v) => { setNewFilterField(v); setNewFilterValue(""); }}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedFilterDef?.type === "select" ? (
                      <Select value={newFilterValue} onValueChange={setNewFilterValue}>
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedFilterDef.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Value"
                        value={newFilterValue}
                        onChange={(e) => setNewFilterValue(e.target.value)}
                        className="border-slate-200"
                      />
                    )}

                    <Button
                      onClick={addFilter}
                      disabled={!newFilterField || !newFilterValue}
                      className="w-full bg-[#1b2a4a] text-white hover:bg-[#243656]"
                    >
                      Add Filter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* View toggle */}
            <div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode("bar")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "bar"
                    ? "bg-[#1b2a4a] text-white"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <BarChart3 className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-[#1b2a4a] text-white"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <TableIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card
        className="animate-fade-up border-0 shadow-sm"
        style={{ animationDelay: "160ms" }}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-500">
            Results ({data.length} groups)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No data matches the current filters
            </p>
          ) : viewMode === "bar" ? (
            <div className="space-y-3">
              {data.map((row, i) => {
                const pct = Math.max(2, Math.round((row.count / maxCount) * 100));
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs font-medium text-[#1a2332]">
                      {row.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-6 overflow-hidden rounded bg-slate-50">
                        <div
                          className="funnel-bar flex h-full items-center rounded pl-2"
                          style={
                            {
                              width: `${pct}%`,
                              "--bar-from": "#5b8def",
                              "--bar-to": "#3b6fd4",
                              animationDelay: `${i * 40}ms`,
                            } as React.CSSProperties
                          }
                        >
                          <span
                            className="text-[10px] font-bold text-white"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {row.count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="w-16 text-right text-[11px] tabular-nums text-slate-400"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      avg {row.avgScore}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {GROUP_OPTIONS.find((g) => g.value === groupBy)?.label ||
                        groupBy}
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Count
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Avg Score
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Avg Days Old
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.label} className="table-row-hover border-slate-100">
                      <TableCell className="font-medium text-[#1a2332]">
                        {row.label}
                      </TableCell>
                      <TableCell
                        className="text-right tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {row.count}
                      </TableCell>
                      <TableCell
                        className="text-right tabular-nums text-slate-500"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {row.avgScore}
                      </TableCell>
                      <TableCell
                        className="text-right tabular-nums text-slate-500"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {row.avgDaysOld}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <ReportBuilderInner />
    </Suspense>
  );
}
