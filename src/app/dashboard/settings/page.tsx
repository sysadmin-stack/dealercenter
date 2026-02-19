"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Building2,
  Plug,
  Timer,
  Shield,
  Target,
  Save,
  Loader2,
  Check,
  X,
  Info,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

interface DealerIdentity {
  name: string;
  location: string;
  salesRep: string;
  salesRepPhone: string;
  email: string;
  valueProps: string[];
}

interface ResendConfig { fromEmail: string; fromName: string }
interface TwilioConfig { phoneNumber: string }
interface WahaConfig { apiUrl: string; session: string }
interface ChatwootConfig { url: string; accountId: string; inboxId: string }
interface ClaudeConfig { model: string }
interface SalesRepConfig { phone: string }

interface SendWindow {
  startHour: number; startMinute: number;
  endHour: number; endMinute: number;
  timezone: string;
}

interface FrequencyCaps {
  perChannelPerWeek: number; totalPerDay: number;
  totalPerWeek: number; minHoursBetweenSameChannel: number;
}

interface Thresholds { hot: number; warm: number; cold: number }

interface Scoring {
  baseHot: number; baseWarm: number; baseCold: number; baseFrozen: number;
  creditAppBonus: number; walkInBonus: number; emailBonus: number;
}

interface CadenceStep {
  day: number; channel: string; hour: number; templateType: string;
}

interface HealthService {
  service: string;
  status: "connected" | "error" | "not_configured";
  message?: string;
}

// ─── Tooltip Component ────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg">
          {text}
          <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
        </div>
      )}
    </span>
  );
}

// ─── Field Components ─────────────────────────────────────

function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {tooltip && <InfoTooltip text={tooltip} />}
    </label>
  );
}

function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      size="sm"
      className={cn(
        "gap-1.5 transition-all",
        saved && "bg-emerald-600 hover:bg-emerald-700",
      )}
    >
      {saving ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : saved ? (
        <Check className="size-3.5" />
      ) : (
        <Save className="size-3.5" />
      )}
      {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
    </Button>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "connected"
    ? "bg-emerald-500"
    : status === "error"
      ? "bg-red-500"
      : "bg-slate-400";
  const label = status === "connected"
    ? "Connected"
    : status === "error"
      ? "Error"
      : "Not Configured";
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function EnvIndicator({ configured }: { configured: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium",
      configured ? "text-emerald-600" : "text-red-500",
    )}>
      {configured ? <Check className="size-3" /> : <X className="size-3" />}
      {configured ? "Configured" : "Missing"}
    </span>
  );
}

// ─── Tooltips Data ────────────────────────────────────────

const TOOLTIPS = {
  dealerName: "Nome da concessionaria usado em todas as mensagens, emails e templates. Aparece no remetente e assinatura. Sugerido: Nome oficial da sua empresa.",
  location: "Cidade/estado usados nas mensagens para contextualizar a localizacao. Sugerido: Cidade e estado principal. Ex: \"Orlando, FL\".",
  salesRep: "Nome do vendedor usado na assinatura de mensagens e como remetente pessoal. Cria conexao humana com o lead.",
  salesRepPhone: "Numero do vendedor que recebe notificacoes de handoff e leads quentes via WhatsApp. Formato: +1XXXXXXXXXX.",
  fromEmail: "Endereco de email remetente para todas as campanhas. Precisa estar verificado no Resend. Sugerido: noreply@seudominio.com.",
  valueProps: "Diferenciais da concessionaria mencionados pela IA nas mensagens. Sugerido: Liste 3-5 diferenciais reais da sua loja.",
  resendFromEmail: "Endereco de email remetente. Precisa estar verificado no painel do Resend.",
  resendFromName: "Nome que aparece como remetente no inbox do lead.",
  wahaApiUrl: "URL do servidor WAHA que controla a sessao do WhatsApp.",
  wahaSession: "Nome da sessao WAHA conectada ao numero de WhatsApp da concessionaria. Sugerido: \"default\".",
  twilioPhone: "Numero de telefone usado para enviar SMSs. Precisa ser um numero Twilio ativo.",
  chatwootUrl: "URL da instancia do Chatwoot para handoff de conversas para atendimento humano.",
  chatwootAccountId: "ID da conta no Chatwoot onde as conversas sao criadas. Geralmente \"1\" para single-account.",
  chatwootInboxId: "ID da caixa de entrada no Chatwoot. Determina em qual inbox as conversas aparecem.",
  claudeModel: "Modelo de IA usado para gerar mensagens. claude-sonnet-4-6 (melhor custo-beneficio). claude-haiku-4-5 para economizar. claude-opus-4-6 para maxima qualidade.",
  sendWindowStart: "Horario mais cedo para enviar mensagens. Florida Telephone Solicitation Act permite a partir das 8 AM. Sugerido: 8:15 AM (15 min de buffer).",
  sendWindowEnd: "Horario mais tarde para envio. Florida permite ate 8 PM. Sugerido: 7:45 PM (15 min de buffer).",
  timezone: "Timezone usado para calcular a janela de envio. Sugerido: America/New_York para Florida.",
  totalPerDay: "Maximo de mensagens que um lead pode receber em um dia, somando todos os canais. Sugerido: 2.",
  totalPerWeek: "Limite semanal total de mensagens por lead. Sugerido: 7.",
  perChannelPerWeek: "Limite de mensagens por canal individual por semana. Sugerido: 3.",
  minHoursBetween: "Intervalo minimo entre duas mensagens no mesmo canal para o mesmo lead. Sugerido: 24 horas.",
  hotThreshold: "Leads com menos de X dias sao HOT. Recebem a cadencia mais agressiva. Sugerido: 90 dias.",
  warmThreshold: "Leads entre HOT e WARM thresholds sao WARM. Reaquecimento necessario. Sugerido: 365 dias.",
  coldThreshold: "Leads entre WARM e COLD thresholds sao COLD. Acima disso, FROZEN. Sugerido: 730 dias (2 anos).",
  baseHot: "Pontuacao base atribuida a leads HOT. Score 0-120, usado para priorizacao. Sugerido: 80.",
  baseWarm: "Pontuacao base para leads WARM. Sugerido: 50.",
  baseCold: "Pontuacao base para leads COLD. Sugerido: 25.",
  baseFrozen: "Pontuacao base para leads FROZEN. Sugerido: 10.",
  creditAppBonus: "Pontos extras para leads com aplicacao de credito. Indica alta intencao de compra. Sugerido: +20.",
  walkInBonus: "Pontos extras para leads que visitaram a loja fisicamente. Sugerido: +15.",
  emailBonus: "Pontos extras para leads que tem email cadastrado. Sugerido: +5.",
} as const;

// ─── Main Component ───────────────────────────────────────

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [health, setHealth] = useState<HealthService[]>([]);
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setSettings(json.data || {});
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/health");
      const json = await res.json();
      setHealth(json.services || []);
      setEnvStatus(json.envStatus || {});
    } catch (err) {
      console.error("Failed to load health:", err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHealth();
  }, [fetchSettings, fetchHealth]);

  const saveSetting = async (key: string) => {
    setSavingKey(key);
    setSavedKey(null);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: settings[key] }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSavingKey(null);
    }
  };

  const updateField = (settingKey: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [settingKey]: { ...prev[settingKey], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const identity: DealerIdentity = settings["dealer.identity"] || {};
  const resend: ResendConfig = settings["integration.resend"] || {};
  const twilio: TwilioConfig = settings["integration.twilio"] || {};
  const waha: WahaConfig = settings["integration.waha"] || {};
  const chatwoot: ChatwootConfig = settings["integration.chatwoot"] || {};
  const claude: ClaudeConfig = settings["integration.claude"] || {};
  const salesRep: SalesRepConfig = settings["integration.salesRep"] || {};
  const sendWindow: SendWindow = settings["compliance.sendWindow"] || {};
  const freqCaps: FrequencyCaps = settings["compliance.frequencyCaps"] || {};
  const thresholds: Thresholds = settings["segmentation.thresholds"] || {};
  const scoring: Scoring = settings["segmentation.scoring"] || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your dealership, integrations, cadences, compliance, and segmentation.
        </p>
      </div>

      <Tabs defaultValue="dealership">
        <TabsList variant="line" className="w-full border-b border-slate-200 pb-0">
          <TabsTrigger value="dealership" className="gap-1.5">
            <Building2 className="size-3.5" /> Dealership
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Plug className="size-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="cadences" className="gap-1.5">
            <Timer className="size-3.5" /> Cadences
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5">
            <Shield className="size-3.5" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="gap-1.5">
            <Target className="size-3.5" /> Segmentation
          </TabsTrigger>
        </TabsList>

        {/* ═══ DEALERSHIP TAB ═══ */}
        <TabsContent value="dealership" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dealership Identity</CardTitle>
              <CardDescription>
                This information is used across all messages, emails, and AI-generated content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel label="Dealer Name" tooltip={TOOLTIPS.dealerName} />
                  <Input
                    value={identity.name || ""}
                    onChange={(e) => updateField("dealer.identity", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Location" tooltip={TOOLTIPS.location} />
                  <Input
                    value={identity.location || ""}
                    onChange={(e) => updateField("dealer.identity", "location", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Sales Rep Name" tooltip={TOOLTIPS.salesRep} />
                  <Input
                    value={identity.salesRep || ""}
                    onChange={(e) => updateField("dealer.identity", "salesRep", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Sales Rep Phone" tooltip={TOOLTIPS.salesRepPhone} />
                  <Input
                    value={identity.salesRepPhone || ""}
                    onChange={(e) => updateField("dealer.identity", "salesRepPhone", e.target.value)}
                    placeholder="+1 407 577 4133"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <FieldLabel label="From Email" tooltip={TOOLTIPS.fromEmail} />
                  <Input
                    type="email"
                    value={identity.email || ""}
                    onChange={(e) => updateField("dealer.identity", "email", e.target.value)}
                  />
                </div>
              </div>

              {/* Value Props */}
              <div className="space-y-2">
                <FieldLabel label="Value Propositions" tooltip={TOOLTIPS.valueProps} />
                <div className="space-y-2">
                  {(identity.valueProps || []).map((prop: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={prop}
                        onChange={(e) => {
                          const updated = [...(identity.valueProps || [])];
                          updated[i] = e.target.value;
                          updateField("dealer.identity", "valueProps", updated);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => {
                          const updated = (identity.valueProps || []).filter((_: string, j: number) => j !== i);
                          updateField("dealer.identity", "valueProps", updated);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const updated = [...(identity.valueProps || []), ""];
                      updateField("dealer.identity", "valueProps", updated);
                    }}
                  >
                    <Plus className="size-3.5" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "dealer.identity"}
                  saved={savedKey === "dealer.identity"}
                  onClick={() => saveSetting("dealer.identity")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INTEGRATIONS TAB ═══ */}
        <TabsContent value="integrations" className="mt-6 space-y-4">
          {/* Resend */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-lg">
                  @
                </div>
                <div>
                  <CardTitle className="text-base">Resend (Email)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "resend")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel label="From Email" tooltip={TOOLTIPS.resendFromEmail} />
                  <Input
                    value={resend.fromEmail || ""}
                    onChange={(e) => updateField("integration.resend", "fromEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="From Name" tooltip={TOOLTIPS.resendFromName} />
                  <Input
                    value={resend.fromName || ""}
                    onChange={(e) => updateField("integration.resend", "fromName", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>API Key: <EnvIndicator configured={envStatus.RESEND_API_KEY} /></span>
                <span>Webhook: <EnvIndicator configured={envStatus.RESEND_WEBHOOK_SECRET} /></span>
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.resend"}
                  saved={savedKey === "integration.resend"}
                  onClick={() => saveSetting("integration.resend")}
                />
              </div>
            </CardContent>
          </Card>

          {/* WAHA */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-green-100 text-lg">
                  W
                </div>
                <div>
                  <CardTitle className="text-base">WAHA (WhatsApp)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "waha")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel label="API URL" tooltip={TOOLTIPS.wahaApiUrl} />
                  <Input
                    value={waha.apiUrl || ""}
                    onChange={(e) => updateField("integration.waha", "apiUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Session" tooltip={TOOLTIPS.wahaSession} />
                  <Input
                    value={waha.session || ""}
                    onChange={(e) => updateField("integration.waha", "session", e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-500">
                API Key: <EnvIndicator configured={envStatus.WAHA_API_KEY} />
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.waha"}
                  saved={savedKey === "integration.waha"}
                  onClick={() => saveSetting("integration.waha")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Twilio */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-lg">
                  T
                </div>
                <div>
                  <CardTitle className="text-base">Twilio (SMS)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "twilio")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel label="Phone Number" tooltip={TOOLTIPS.twilioPhone} />
                <Input
                  value={twilio.phoneNumber || ""}
                  onChange={(e) => updateField("integration.twilio", "phoneNumber", e.target.value)}
                  placeholder="+1 407 577 4133"
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Account SID: <EnvIndicator configured={envStatus.TWILIO_ACCOUNT_SID} /></span>
                <span>Auth Token: <EnvIndicator configured={envStatus.TWILIO_AUTH_TOKEN} /></span>
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.twilio"}
                  saved={savedKey === "integration.twilio"}
                  onClick={() => saveSetting("integration.twilio")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chatwoot */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-lg">
                  C
                </div>
                <div>
                  <CardTitle className="text-base">Chatwoot (CRM)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "chatwoot")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <FieldLabel label="URL" tooltip={TOOLTIPS.chatwootUrl} />
                  <Input
                    value={chatwoot.url || ""}
                    onChange={(e) => updateField("integration.chatwoot", "url", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Account ID" tooltip={TOOLTIPS.chatwootAccountId} />
                  <Input
                    value={chatwoot.accountId || ""}
                    onChange={(e) => updateField("integration.chatwoot", "accountId", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Inbox ID" tooltip={TOOLTIPS.chatwootInboxId} />
                  <Input
                    value={chatwoot.inboxId || ""}
                    onChange={(e) => updateField("integration.chatwoot", "inboxId", e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-500">
                API Token: <EnvIndicator configured={envStatus.CHATWOOT_API_TOKEN} />
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.chatwoot"}
                  saved={savedKey === "integration.chatwoot"}
                  onClick={() => saveSetting("integration.chatwoot")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Claude */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-lg">
                  AI
                </div>
                <div>
                  <CardTitle className="text-base">Claude AI (Copywriter)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "claude")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel label="Model" tooltip={TOOLTIPS.claudeModel} />
                <Select
                  value={claude.model || "claude-sonnet-4-6-20250514"}
                  onValueChange={(val) => updateField("integration.claude", "model", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-haiku-4-5-20251001">claude-haiku-4-5 (Budget)</SelectItem>
                    <SelectItem value="claude-sonnet-4-6-20250514">claude-sonnet-4-6 (Recommended)</SelectItem>
                    <SelectItem value="claude-opus-4-6-20250610">claude-opus-4-6 (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-500">
                API Key: <EnvIndicator configured={envStatus.ANTHROPIC_API_KEY} />
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.claude"}
                  saved={savedKey === "integration.claude"}
                  onClick={() => saveSetting("integration.claude")}
                />
              </div>
            </CardContent>
          </Card>

          {/* N8N */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-lg">
                  n8n
                </div>
                <div>
                  <CardTitle className="text-base">N8N (Automation)</CardTitle>
                </div>
              </div>
              <StatusDot status={health.find((h) => h.service === "n8n")?.status || "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-500">
                Webhook Secret: <EnvIndicator configured={envStatus.N8N_WEBHOOK_SECRET} />
              </div>
            </CardContent>
          </Card>

          {/* Sales Rep */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-lg">
                  SR
                </div>
                <div>
                  <CardTitle className="text-base">Sales Rep (Handoff)</CardTitle>
                </div>
              </div>
              <StatusDot status={salesRep.phone ? "connected" : "not_configured"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel label="Sales Rep Phone" tooltip={TOOLTIPS.salesRepPhone} />
                <Input
                  value={salesRep.phone || ""}
                  onChange={(e) => updateField("integration.salesRep", "phone", e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div className="text-sm text-slate-500">
                Env var: <EnvIndicator configured={envStatus.SALES_REP_PHONE} />
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "integration.salesRep"}
                  saved={savedKey === "integration.salesRep"}
                  onClick={() => saveSetting("integration.salesRep")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CADENCES TAB ═══ */}
        <TabsContent value="cadences" className="mt-6 space-y-4">
          <CadenceEditor
            settings={settings}
            setSettings={setSettings}
            saveSetting={saveSetting}
            savingKey={savingKey}
            savedKey={savedKey}
          />
        </TabsContent>

        {/* ═══ COMPLIANCE TAB ═══ */}
        <TabsContent value="compliance" className="mt-6 space-y-4">
          {/* Send Window */}
          <Card>
            <CardHeader>
              <CardTitle>Send Window</CardTitle>
              <CardDescription>
                Messages outside this window are automatically rescheduled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <FieldLabel label="Start Hour" tooltip={TOOLTIPS.sendWindowStart} />
                  <Input
                    type="number" min={0} max={23}
                    value={sendWindow.startHour ?? 8}
                    onChange={(e) => updateField("compliance.sendWindow", "startHour", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Start Minute" />
                  <Input
                    type="number" min={0} max={59}
                    value={sendWindow.startMinute ?? 15}
                    onChange={(e) => updateField("compliance.sendWindow", "startMinute", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="End Hour" tooltip={TOOLTIPS.sendWindowEnd} />
                  <Input
                    type="number" min={0} max={23}
                    value={sendWindow.endHour ?? 19}
                    onChange={(e) => updateField("compliance.sendWindow", "endHour", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="End Minute" />
                  <Input
                    type="number" min={0} max={59}
                    value={sendWindow.endMinute ?? 45}
                    onChange={(e) => updateField("compliance.sendWindow", "endMinute", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Timezone" tooltip={TOOLTIPS.timezone} />
                  <Select
                    value={sendWindow.timezone || "America/New_York"}
                    onValueChange={(val) => updateField("compliance.sendWindow", "timezone", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">America/New_York (ET)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (CT)</SelectItem>
                      <SelectItem value="America/Denver">America/Denver (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Window is currently set to <strong>{sendWindow.startHour ?? 8}:{String(sendWindow.startMinute ?? 15).padStart(2, "0")} - {sendWindow.endHour ?? 19}:{String(sendWindow.endMinute ?? 45).padStart(2, "0")}</strong> {sendWindow.timezone || "America/New_York"}.
                  Florida Telephone Solicitation Act allows 8:00 AM - 8:00 PM.
                </span>
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "compliance.sendWindow"}
                  saved={savedKey === "compliance.sendWindow"}
                  onClick={() => saveSetting("compliance.sendWindow")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Frequency Caps */}
          <Card>
            <CardHeader>
              <CardTitle>Frequency Caps</CardTitle>
              <CardDescription>
                Limits on how often a single lead can be contacted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <FieldLabel label="Max / Day" tooltip={TOOLTIPS.totalPerDay} />
                  <Input
                    type="number" min={1} max={10}
                    value={freqCaps.totalPerDay ?? 2}
                    onChange={(e) => updateField("compliance.frequencyCaps", "totalPerDay", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Max / Week" tooltip={TOOLTIPS.totalPerWeek} />
                  <Input
                    type="number" min={1} max={30}
                    value={freqCaps.totalPerWeek ?? 7}
                    onChange={(e) => updateField("compliance.frequencyCaps", "totalPerWeek", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Per Channel / Week" tooltip={TOOLTIPS.perChannelPerWeek} />
                  <Input
                    type="number" min={1} max={10}
                    value={freqCaps.perChannelPerWeek ?? 3}
                    onChange={(e) => updateField("compliance.frequencyCaps", "perChannelPerWeek", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Min Hours Between" tooltip={TOOLTIPS.minHoursBetween} />
                  <Input
                    type="number" min={1} max={72}
                    value={freqCaps.minHoursBetweenSameChannel ?? 24}
                    onChange={(e) => updateField("compliance.frequencyCaps", "minHoursBetweenSameChannel", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "compliance.frequencyCaps"}
                  saved={savedKey === "compliance.frequencyCaps"}
                  onClick={() => saveSetting("compliance.frequencyCaps")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SEGMENTATION TAB ═══ */}
        <TabsContent value="segmentation" className="mt-6 space-y-4">
          {/* Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Thresholds (days)</CardTitle>
              <CardDescription>
                How many days since last interaction to classify leads into segments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <FieldLabel label="HOT (< X days)" tooltip={TOOLTIPS.hotThreshold} />
                  <Input
                    type="number" min={1}
                    value={thresholds.hot ?? 90}
                    onChange={(e) => updateField("segmentation.thresholds", "hot", parseInt(e.target.value) || 90)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="WARM (< X days)" tooltip={TOOLTIPS.warmThreshold} />
                  <Input
                    type="number" min={1}
                    value={thresholds.warm ?? 365}
                    onChange={(e) => updateField("segmentation.thresholds", "warm", parseInt(e.target.value) || 365)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="COLD (< X days)" tooltip={TOOLTIPS.coldThreshold} />
                  <Input
                    type="number" min={1}
                    value={thresholds.cold ?? 730}
                    onChange={(e) => updateField("segmentation.thresholds", "cold", parseInt(e.target.value) || 730)}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 border p-3 text-xs text-slate-600">
                HOT: 0-{thresholds.hot ?? 90} days | WARM: {thresholds.hot ?? 90}-{thresholds.warm ?? 365} days | COLD: {thresholds.warm ?? 365}-{thresholds.cold ?? 730} days | FROZEN: {thresholds.cold ?? 730}+ days
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "segmentation.thresholds"}
                  saved={savedKey === "segmentation.thresholds"}
                  onClick={() => saveSetting("segmentation.thresholds")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring</CardTitle>
              <CardDescription>
                Base scores by segment and bonus points for lead attributes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Base Scores</p>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <FieldLabel label="HOT" tooltip={TOOLTIPS.baseHot} />
                    <Input
                      type="number" min={0} max={120}
                      value={scoring.baseHot ?? 80}
                      onChange={(e) => updateField("segmentation.scoring", "baseHot", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="WARM" tooltip={TOOLTIPS.baseWarm} />
                    <Input
                      type="number" min={0} max={120}
                      value={scoring.baseWarm ?? 50}
                      onChange={(e) => updateField("segmentation.scoring", "baseWarm", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="COLD" tooltip={TOOLTIPS.baseCold} />
                    <Input
                      type="number" min={0} max={120}
                      value={scoring.baseCold ?? 25}
                      onChange={(e) => updateField("segmentation.scoring", "baseCold", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="FROZEN" tooltip={TOOLTIPS.baseFrozen} />
                    <Input
                      type="number" min={0} max={120}
                      value={scoring.baseFrozen ?? 10}
                      onChange={(e) => updateField("segmentation.scoring", "baseFrozen", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Bonus Points</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <FieldLabel label="Credit App" tooltip={TOOLTIPS.creditAppBonus} />
                    <Input
                      type="number" min={0} max={50}
                      value={scoring.creditAppBonus ?? 20}
                      onChange={(e) => updateField("segmentation.scoring", "creditAppBonus", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Walk-in" tooltip={TOOLTIPS.walkInBonus} />
                    <Input
                      type="number" min={0} max={50}
                      value={scoring.walkInBonus ?? 15}
                      onChange={(e) => updateField("segmentation.scoring", "walkInBonus", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Has Email" tooltip={TOOLTIPS.emailBonus} />
                    <Input
                      type="number" min={0} max={50}
                      value={scoring.emailBonus ?? 5}
                      onChange={(e) => updateField("segmentation.scoring", "emailBonus", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t pt-4">
                <SaveButton
                  saving={savingKey === "segmentation.scoring"}
                  saved={savedKey === "segmentation.scoring"}
                  onClick={() => saveSetting("segmentation.scoring")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Cadence Editor Component ─────────────────────────────

const SEGMENT_LABELS: Record<string, { label: string; color: string; description: string }> = {
  SUPER_HOT: { label: "SUPER HOT", color: "text-rose-600", description: "High-intent leads (credit app, walk-in). 5 touches in 3 days." },
  HOT: { label: "HOT", color: "text-red-600", description: "Recent leads (< 90 days). 10 touches in 30 days." },
  WARM: { label: "WARM", color: "text-amber-600", description: "3-12 months old. 7 touches in 45 days." },
  COLD: { label: "COLD", color: "text-blue-600", description: "1-2 years old. 5 touches in 75 days." },
  FROZEN: { label: "FROZEN", color: "text-slate-600", description: "2+ years old. 3 touches in 90 days." },
  NURTURE: { label: "NURTURE", color: "text-purple-600", description: "Post-cadence drip. 6 touches over 360 days." },
};

const CHANNEL_OPTIONS = ["whatsapp", "email", "sms", "task"];
const TEMPLATE_OPTIONS = [
  "personal_intro", "stock_offer", "quick_checkin", "value_proposition",
  "financing_options", "short_followup", "social_proof", "inventory_update",
  "special_offer", "last_touch", "reintroduction", "value_message",
  "new_arrivals", "pattern_break", "last_touch_email", "newsletter",
  "single_reactivation", "long_time_reconnect",
  "super_hot_intro", "super_hot_offer", "super_hot_sms", "super_hot_human_touch",
  "assign_to_rep",
  "nurture_new_inventory", "nurture_market_update", "nurture_checkin",
  "nurture_seasonal", "nurture_reconnect", "nurture_annual",
];

function CadenceEditor({
  settings,
  setSettings,
  saveSetting,
  savingKey,
  savedKey,
}: {
  settings: Record<string, any>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  saveSetting: (key: string) => void;
  savingKey: string | null;
  savedKey: string | null;
}) {
  const [activeSegment, setActiveSegment] = useState("HOT");

  const cadenceKey = `cadence.${activeSegment}`;
  const steps: CadenceStep[] = settings[cadenceKey] || [];

  const updateSteps = (newSteps: CadenceStep[]) => {
    setSettings((prev) => ({ ...prev, [cadenceKey]: newSteps }));
  };

  const updateStep = (index: number, field: keyof CadenceStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    updateSteps(updated);
  };

  const addStep = () => {
    const lastDay = steps.length > 0 ? steps[steps.length - 1].day + 1 : 0;
    updateSteps([...steps, { day: lastDay, channel: "email", hour: 9, templateType: "short_followup" }]);
  };

  const removeStep = (index: number) => {
    updateSteps(steps.filter((_, i) => i !== index));
  };

  const segmentInfo = SEGMENT_LABELS[activeSegment] || SEGMENT_LABELS.HOT;

  return (
    <>
      {/* Segment pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SEGMENT_LABELS).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setActiveSegment(key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              activeSegment === key
                ? `${color} bg-white shadow-sm border`
                : "text-slate-500 hover:text-slate-700 border border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={cn("text-base", segmentInfo.color)}>
            {segmentInfo.label} Cadence
          </CardTitle>
          <CardDescription>{segmentInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-slate-500">
              No steps configured for this cadence. Click "Add Step" to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Day</th>
                    <th className="pb-2 pr-3">Hour</th>
                    <th className="pb-2 pr-3">Channel</th>
                    <th className="pb-2 pr-3">Template Type</th>
                    <th className="pb-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number" min={0} className="h-8 w-16"
                          value={step.day}
                          onChange={(e) => updateStep(i, "day", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number" min={0} max={23} className="h-8 w-16"
                          value={step.hour}
                          onChange={(e) => updateStep(i, "hour", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Select
                          value={step.channel}
                          onValueChange={(val) => updateStep(i, "channel", val)}
                        >
                          <SelectTrigger size="sm" className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHANNEL_OPTIONS.map((ch) => (
                              <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-3">
                        <Select
                          value={step.templateType}
                          onValueChange={(val) => updateStep(i, "templateType", val)}
                        >
                          <SelectTrigger size="sm" className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_OPTIONS.map((tpl) => (
                              <SelectItem key={tpl} value={tpl}>{tpl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => removeStep(i)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addStep}>
              <Plus className="size-3.5" /> Add Step
            </Button>
            <SaveButton
              saving={savingKey === cadenceKey}
              saved={savedKey === cadenceKey}
              onClick={() => saveSetting(cadenceKey)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
