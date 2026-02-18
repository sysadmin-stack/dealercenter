import { db } from "@/lib/db";
import * as chatwoot from "@/lib/clients/chatwoot";
import { sendWhatsApp } from "@/lib/clients/waha";

const SALES_REP_PHONE = process.env.SALES_REP_PHONE || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Assign a super_hot lead directly to a sales rep on day 3.
 * Creates a Chatwoot task and notifies the rep via WhatsApp.
 * Only triggers if the lead hasn't replied to any touches yet.
 */
export async function assignToRep(leadId: string, campaignId: string): Promise<boolean> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return false;

  // Check if lead already replied to any touch in this campaign
  const hasReplied = await db.touch.findFirst({
    where: {
      leadId,
      campaignId,
      status: "replied",
    },
  });

  if (hasReplied) {
    console.log(`[AssignRep] Lead ${lead.name} already replied — skipping assignment`);
    return false;
  }

  // Check if there's already an open human conversation
  const existingConvo = await db.conversation.findFirst({
    where: { leadId, status: "human" },
  });

  if (existingConvo) {
    console.log(`[AssignRep] Lead ${lead.name} already in human conversation — skipping`);
    return false;
  }

  // Create a Chatwoot contact and conversation for the rep
  try {
    const contact = await chatwoot.createContact({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
    });

    const conversation = await chatwoot.createConversation(contact.id);

    // Add note with lead context
    const noteLines = [
      `**Super HOT Lead — Day 3 Assignment**`,
      `This lead completed a credit application but hasn't purchased.`,
      ``,
      `Name: ${lead.name}`,
      `Phone: ${lead.phone || "N/A"}`,
      `Email: ${lead.email || "N/A"}`,
      `Segment: ${lead.segment}`,
      `Score: ${lead.score}`,
      `Source: ${lead.source || "Unknown"}`,
      `Language: ${lead.language}`,
      ``,
      `No response to automated messages after 3 days.`,
      `Please call or message this lead directly.`,
    ];

    await chatwoot.addNote(conversation.id, noteLines.join("\n"));

    console.log(
      `[AssignRep] Created Chatwoot task #${conversation.id} for ${lead.name}`,
    );
  } catch (err) {
    console.error(`[AssignRep] Chatwoot failed: ${err}`);
    // Continue to notify via WhatsApp even if Chatwoot fails
  }

  // Notify sales rep via WhatsApp
  if (SALES_REP_PHONE) {
    const firstName = lead.name.split(" ")[0];
    const msg = [
      `Super HOT lead — please call today`,
      ``,
      `${lead.name}`,
      lead.phone ? `Phone: ${lead.phone}` : "",
      `Segment: ${lead.segment} | Score: ${lead.score}`,
      `Credit app on file`,
      `No response after 3 days of outreach`,
      ``,
      `Dashboard: ${APP_URL}/dashboard/leads?tag=super_hot`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendWhatsApp(SALES_REP_PHONE, msg);
      console.log(`[AssignRep] Notified sales rep about ${firstName}`);
    } catch (err) {
      console.error(`[AssignRep] WhatsApp notification failed: ${err}`);
    }
  }

  // Mark in conversation table
  await db.conversation.create({
    data: {
      leadId,
      channel: "whatsapp",
      status: "human",
      messages: [
        {
          role: "system",
          text: "Day 3 super_hot auto-assignment to sales rep",
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });

  return true;
}
