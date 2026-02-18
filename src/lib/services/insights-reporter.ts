import { db } from "@/lib/db";
import { generateWithClaude } from "@/lib/clients/claude";
import { sendWhatsApp } from "@/lib/clients/waha";

const SALES_REP_PHONE = process.env.SALES_REP_PHONE || "";

/**
 * Generate a weekly AI insights report using Claude.
 * Collects metrics from the past 7 days, sends to Claude for analysis,
 * then delivers via WhatsApp.
 */
export async function generateWeeklyReport(): Promise<string> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Collect metrics
  const [
    touchesSent,
    touchesByChannel,
    touchesByStatus,
    newLeads,
    optOuts,
    conversations,
    handoffs,
    abResults,
    bestTimes,
  ] = await Promise.all([
    db.touch.count({ where: { sentAt: { gte: since } } }),
    db.touch.groupBy({
      by: ["channel"],
      where: { sentAt: { gte: since } },
      _count: true,
    }),
    db.touch.groupBy({
      by: ["status"],
      where: { sentAt: { gte: since } },
      _count: true,
    }),
    db.lead.count({ where: { createdAt: { gte: since } } }),
    db.lead.count({
      where: { optedOut: true, updatedAt: { gte: since } },
    }),
    db.conversation.count({ where: { createdAt: { gte: since } } }),
    db.conversation.count({
      where: { status: "human", updatedAt: { gte: since } },
    }),
    db.abResult.findMany({
      where: { analyzedAt: { gte: since } },
      orderBy: { analyzedAt: "desc" },
    }),
    db.bestTime.findMany({
      where: { calculatedAt: { gte: since } },
      orderBy: { calculatedAt: "desc" },
      distinct: ["channel", "segment"],
    }),
  ]);

  const byChannel: Record<string, number> = {};
  for (const t of touchesByChannel) byChannel[t.channel] = t._count;

  const byStatus: Record<string, number> = {};
  for (const t of touchesByStatus) byStatus[t.status] = t._count;

  const delivered =
    (byStatus.delivered ?? 0) +
    (byStatus.opened ?? 0) +
    (byStatus.clicked ?? 0) +
    (byStatus.replied ?? 0);
  const deliveryRate =
    touchesSent > 0 ? ((delivered / touchesSent) * 100).toFixed(1) : "0.0";

  const metricsJson = JSON.stringify(
    {
      period: "7 days",
      touchesSent,
      byChannel,
      byStatus,
      deliveryRate: `${deliveryRate}%`,
      newLeads,
      optOuts,
      conversations,
      handoffs,
      abResults: abResults.map((r) => ({
        channel: r.channel,
        segment: r.segment,
        winner: r.winner,
        lift: r.lift ? `${(r.lift * 100).toFixed(1)}%` : null,
        sampleA: r.sampleSizeA,
        sampleB: r.sampleSizeB,
        reason: r.reason,
      })),
      bestTimes: bestTimes.map((bt) => ({
        channel: bt.channel,
        segment: bt.segment,
        bestHour: `${bt.bestHour}:00 ET`,
        dayOfWeek: [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ][bt.bestDayOfWeek],
        engagementRate: `${(bt.engagementRate * 100).toFixed(1)}%`,
      })),
    },
    null,
    2,
  );

  const systemPrompt = `You are an analytics expert for a used car dealership (Florida Auto Center) that runs automated lead reactivation campaigns via WhatsApp, email, and SMS. You write concise, actionable reports in Portuguese (BR).`;

  const userPrompt = `Analise estes dados de campanha de reativacao de leads automotivos e gere um relatorio executivo em portugues com:
1. Performance geral (2-3 paragrafos curtos)
2. Top 3 insights acionaveis
3. Recomendacoes para a proxima semana

Dados: ${metricsJson}

Seja direto, use numeros concretos, evite jargoes. Formato para WhatsApp (sem markdown, use emoji moderadamente).`;

  try {
    const { text } = await generateWithClaude(systemPrompt, userPrompt, {
      maxTokens: 1024,
      temperature: 0.5,
    });

    // Send via WhatsApp if configured
    if (SALES_REP_PHONE) {
      await sendWhatsApp(SALES_REP_PHONE, text).catch((err) => {
        console.error(`[Insights] Failed to send WhatsApp: ${err}`);
      });
    }

    console.log(`[Insights] Weekly report generated (${text.length} chars)`);
    return text;
  } catch (err) {
    // Fallback: plain text summary
    const fallback = [
      `Relatorio Semanal — Florida Auto Center`,
      ``,
      `Toques enviados: ${touchesSent}`,
      `  WhatsApp: ${byChannel.whatsapp ?? 0}`,
      `  Email: ${byChannel.email ?? 0}`,
      `  SMS: ${byChannel.sms ?? 0}`,
      ``,
      `Taxa de entrega: ${deliveryRate}%`,
      `Respostas: ${byStatus.replied ?? 0}`,
      `Handoffs: ${handoffs}`,
      `Opt-outs: ${optOuts}`,
    ].join("\n");

    console.error(`[Insights] Claude failed, using fallback: ${err}`);

    if (SALES_REP_PHONE) {
      await sendWhatsApp(SALES_REP_PHONE, fallback).catch(() => {});
    }

    return fallback;
  }
}
