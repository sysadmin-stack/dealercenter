import type { Channel, Language, Segment } from "@/generated/prisma/client";

interface FallbackTemplate {
  subject?: string;
  text: string;
  html?: string;
}

type TemplateKey = `${Channel}:${string}`;

/**
 * Fallback templates used when Claude API is unavailable.
 * Keyed by channel:templateType, with language variants.
 */
const templates: Record<Language, Record<TemplateKey, FallbackTemplate>> = {
  EN: {
    // ─── WhatsApp ───
    "whatsapp:personal_intro": {
      text: "Hi {{name}}! This is Antonio from Florida Auto Center. I noticed you were looking at our inventory recently. Is there a specific vehicle you're interested in? I'd love to help you find the perfect car!",
    },
    "whatsapp:stock_offer": {
      text: "Hey {{name}}, we just got some amazing new arrivals! Would you like me to send you some options that match what you're looking for?",
    },
    "whatsapp:short_followup": {
      text: "Hi {{name}}, just checking in! Still looking for a car? Let me know if I can help. - Antonio, Florida Auto Center",
    },
    "whatsapp:last_touch": {
      text: "{{name}}, I don't want to bother you, but wanted to make sure you know we're here whenever you're ready. Feel free to reach out anytime!",
    },
    "whatsapp:value_message": {
      text: "Hi {{name}}! Quick tip: we offer free CARFAX reports on all our vehicles and flexible financing options. Let me know if you'd like to explore your options!",
    },
    "whatsapp:pattern_break": {
      text: "{{name}}, I know car shopping can be stressful. We pride ourselves on a no-pressure experience. When you're ready, I'm here to help.",
    },
    "whatsapp:single_reactivation": {
      text: "Hi {{name}}! It's been a while since we connected. We have some great deals right now. Interested in taking a look?",
    },
    // ─── Email ───
    "email:stock_offer": {
      subject: "{{name}}, check out our latest inventory!",
      text: "Hi {{name}},\n\nWe have some exciting new vehicles in stock that might be perfect for you.\n\nVisit us at Florida Auto Center or reply to this email to learn more.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We have some exciting new vehicles in stock that might be perfect for you.</p><p>Visit us at <strong>Florida Auto Center</strong> or reply to this email to learn more.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:reintroduction": {
      subject: "{{name}}, we'd love to reconnect!",
      text: "Hi {{name}},\n\nIt's been a while since we last spoke. We have new inventory and great financing options available.\n\nLet us know if we can help!\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>It's been a while since we last spoke. We have new inventory and great financing options available.</p><p>Let us know if we can help!</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:social_proof": {
      subject: "See why customers love Florida Auto Center",
      text: "Hi {{name}},\n\nOur customers love the experience at Florida Auto Center. Join hundreds of happy car owners!\n\nReply to get started.\n\nBest,\nAntonio Sanches",
      html: "<p>Hi {{name}},</p><p>Our customers love the experience at Florida Auto Center. Join hundreds of happy car owners!</p><p>Reply to get started.</p><p>Best,<br>Antonio Sanches</p>",
    },
    "email:special_offer": {
      subject: "{{name}}, special offer just for you!",
      text: "Hi {{name}},\n\nWe have a limited-time offer that might interest you. Contact us to learn more!\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We have a <strong>limited-time offer</strong> that might interest you. Contact us to learn more!</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:newsletter": {
      subject: "Florida Auto Center — Monthly Update",
      text: "Hi {{name}},\n\nHere's what's new at Florida Auto Center this month.\n\nNew arrivals, financing specials, and more!\n\nBest,\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>Here's what's new at Florida Auto Center this month.</p><p>New arrivals, financing specials, and more!</p><p>Best,<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:short_followup": {
      text: "Hi {{name}}, still looking for a car? Florida Auto Center has great options. Reply STOP to opt out.",
    },
    "sms:last_touch": {
      text: "{{name}}, we're here when you're ready! Florida Auto Center - Reply STOP to opt out.",
    },
  },
  PT: {
    // ─── WhatsApp ───
    "whatsapp:personal_intro": {
      text: "Oi {{name}}! Aqui e o Antonio da Florida Auto Center. Vi que voce estava olhando nosso estoque recentemente. Tem algum veiculo especifico que te interessa? Adoraria ajudar voce a encontrar o carro perfeito!",
    },
    "whatsapp:stock_offer": {
      text: "Oi {{name}}, acabamos de receber carros incriveis! Quer que eu te mande algumas opcoes que combinam com o que voce procura?",
    },
    "whatsapp:short_followup": {
      text: "Oi {{name}}, tudo bem? Ainda procurando carro? Me avisa se posso ajudar. - Antonio, Florida Auto Center",
    },
    "whatsapp:last_touch": {
      text: "{{name}}, nao quero incomodar, mas queria que soubesse que estamos aqui quando voce estiver pronto. Fique a vontade pra entrar em contato!",
    },
    "whatsapp:value_message": {
      text: "Oi {{name}}! Dica rapida: oferecemos CARFAX gratis em todos os veiculos e financiamento flexivel. Quer explorar suas opcoes?",
    },
    "whatsapp:pattern_break": {
      text: "{{name}}, sei que comprar carro pode ser estressante. Aqui na Florida Auto Center a experiencia e sem pressao. Quando estiver pronto, estou aqui.",
    },
    "whatsapp:single_reactivation": {
      text: "Oi {{name}}! Faz um tempo que nao nos falamos. Temos otimas ofertas agora. Quer dar uma olhada?",
    },
    // ─── Email ───
    "email:stock_offer": {
      subject: "{{name}}, confira nosso estoque mais recente!",
      text: "Oi {{name}},\n\nTemos veiculos novos incriveis no estoque que podem ser perfeitos pra voce.\n\nVisite a Florida Auto Center ou responda este email.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Temos veiculos novos incriveis no estoque que podem ser perfeitos pra voce.</p><p>Visite a <strong>Florida Auto Center</strong> ou responda este email.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:reintroduction": {
      subject: "{{name}}, vamos nos reconectar!",
      text: "Oi {{name}},\n\nFaz um tempo que nao conversamos. Temos estoque novo e otimas opcoes de financiamento.\n\nNos avise se podemos ajudar!\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Faz um tempo que nao conversamos. Temos estoque novo e otimas opcoes de financiamento.</p><p>Nos avise se podemos ajudar!</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:social_proof": {
      subject: "Veja por que clientes amam a Florida Auto Center",
      text: "Oi {{name}},\n\nNossos clientes amam a experiencia na Florida Auto Center. Junte-se a centenas de compradores satisfeitos!\n\nResponda pra comecar.\n\nAbraco,\nAntonio Sanches",
      html: "<p>Oi {{name}},</p><p>Nossos clientes amam a experiencia na Florida Auto Center. Junte-se a centenas de compradores satisfeitos!</p><p>Responda pra comecar.</p><p>Abraco,<br>Antonio Sanches</p>",
    },
    "email:special_offer": {
      subject: "{{name}}, oferta especial so pra voce!",
      text: "Oi {{name}},\n\nTemos uma oferta por tempo limitado que pode te interessar. Entre em contato!\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Temos uma <strong>oferta por tempo limitado</strong> que pode te interessar. Entre em contato!</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:newsletter": {
      subject: "Florida Auto Center — Novidades do Mes",
      text: "Oi {{name}},\n\nVeja o que ha de novo na Florida Auto Center este mes.\n\nNovos veiculos, promocoes de financiamento e mais!\n\nAbraco,\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Veja o que ha de novo na Florida Auto Center este mes.</p><p>Novos veiculos, promocoes de financiamento e mais!</p><p>Abraco,<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:short_followup": {
      text: "Oi {{name}}, ainda procurando carro? Florida Auto Center tem otimas opcoes. Responda PARAR para cancelar.",
    },
    "sms:last_touch": {
      text: "{{name}}, estamos aqui quando voce estiver pronto! Florida Auto Center - Responda PARAR para cancelar.",
    },
  },
  ES: {
    // ─── WhatsApp ───
    "whatsapp:personal_intro": {
      text: "Hola {{name}}! Soy Antonio de Florida Auto Center. Note que estabas viendo nuestro inventario. Hay algun vehiculo especifico que te interese? Me encantaria ayudarte a encontrar el carro perfecto!",
    },
    "whatsapp:stock_offer": {
      text: "Hola {{name}}, acabamos de recibir carros increibles! Quieres que te envie algunas opciones que se ajusten a lo que buscas?",
    },
    "whatsapp:short_followup": {
      text: "Hola {{name}}, solo queria saber como vas. Sigues buscando carro? Avisame si puedo ayudar. - Antonio, Florida Auto Center",
    },
    "whatsapp:last_touch": {
      text: "{{name}}, no quiero molestarte, pero queria asegurarme de que sepas que estamos aqui cuando estes listo. No dudes en contactarnos!",
    },
    "whatsapp:value_message": {
      text: "Hola {{name}}! Dato rapido: ofrecemos CARFAX gratis en todos los vehiculos y financiamiento flexible. Quieres explorar tus opciones?",
    },
    "whatsapp:pattern_break": {
      text: "{{name}}, se que comprar carro puede ser estresante. En Florida Auto Center la experiencia es sin presion. Cuando estes listo, estoy aqui.",
    },
    "whatsapp:single_reactivation": {
      text: "Hola {{name}}! Ha pasado un tiempo desde que hablamos. Tenemos excelentes ofertas ahora. Te interesa echar un vistazo?",
    },
    // ─── Email ───
    "email:stock_offer": {
      subject: "{{name}}, mira nuestro inventario mas reciente!",
      text: "Hola {{name}},\n\nTenemos vehiculos nuevos increibles que podrian ser perfectos para ti.\n\nVisitanos en Florida Auto Center o responde este email.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Tenemos vehiculos nuevos increibles que podrian ser perfectos para ti.</p><p>Visitanos en <strong>Florida Auto Center</strong> o responde este email.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:reintroduction": {
      subject: "{{name}}, reconectemos!",
      text: "Hola {{name}},\n\nHa pasado un tiempo. Tenemos inventario nuevo y excelentes opciones de financiamiento.\n\nAvisanos si podemos ayudar!\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Ha pasado un tiempo. Tenemos inventario nuevo y excelentes opciones de financiamiento.</p><p>Avisanos si podemos ayudar!</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:social_proof": {
      subject: "Mira por que los clientes aman Florida Auto Center",
      text: "Hola {{name}},\n\nNuestros clientes aman la experiencia en Florida Auto Center. Unete a cientos de compradores satisfechos!\n\nResponde para comenzar.\n\nSaludos,\nAntonio Sanches",
      html: "<p>Hola {{name}},</p><p>Nuestros clientes aman la experiencia en Florida Auto Center. Unete a cientos de compradores satisfechos!</p><p>Responde para comenzar.</p><p>Saludos,<br>Antonio Sanches</p>",
    },
    "email:special_offer": {
      subject: "{{name}}, oferta especial solo para ti!",
      text: "Hola {{name}},\n\nTenemos una oferta por tiempo limitado que podria interesarte. Contactanos!\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Tenemos una <strong>oferta por tiempo limitado</strong> que podria interesarte. Contactanos!</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:newsletter": {
      subject: "Florida Auto Center — Novedades del Mes",
      text: "Hola {{name}},\n\nMira lo nuevo en Florida Auto Center este mes.\n\nNuevos vehiculos, promociones de financiamiento y mas!\n\nSaludos,\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Mira lo nuevo en Florida Auto Center este mes.</p><p>Nuevos vehiculos, promociones de financiamiento y mas!</p><p>Saludos,<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:short_followup": {
      text: "Hola {{name}}, sigues buscando carro? Florida Auto Center tiene excelentes opciones. Responde PARAR para cancelar.",
    },
    "sms:last_touch": {
      text: "{{name}}, estamos aqui cuando estes listo! Florida Auto Center - Responde PARAR para cancelar.",
    },
  },
};

/**
 * Default fallback per channel when no specific templateType matches.
 */
const defaultFallback: Record<Language, Record<Channel, FallbackTemplate>> = {
  EN: {
    whatsapp: {
      text: "Hi {{name}}, this is Florida Auto Center. We'd love to help you find your next car! Reply to chat with us.",
    },
    email: {
      subject: "Florida Auto Center — We're here to help!",
      text: "Hi {{name}},\n\nWe'd love to help you find your next car. Reply to get started.\n\nBest,\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We'd love to help you find your next car. Reply to get started.</p><p>Best,<br>Florida Auto Center</p>",
    },
    sms: {
      text: "Hi {{name}}, Florida Auto Center here. We'd love to help you find your next car! Reply STOP to opt out.",
    },
  },
  PT: {
    whatsapp: {
      text: "Oi {{name}}, aqui e a Florida Auto Center. Adorariamos ajudar voce a encontrar seu proximo carro! Responda pra conversar.",
    },
    email: {
      subject: "Florida Auto Center — Estamos aqui pra ajudar!",
      text: "Oi {{name}},\n\nAdorariamos ajudar voce a encontrar seu proximo carro. Responda pra comecar.\n\nAbraco,\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Adorariamos ajudar voce a encontrar seu proximo carro. Responda pra comecar.</p><p>Abraco,<br>Florida Auto Center</p>",
    },
    sms: {
      text: "Oi {{name}}, Florida Auto Center aqui. Adorariamos ajudar voce! Responda PARAR para cancelar.",
    },
  },
  ES: {
    whatsapp: {
      text: "Hola {{name}}, aqui Florida Auto Center. Nos encantaria ayudarte a encontrar tu proximo carro! Responde para conversar.",
    },
    email: {
      subject: "Florida Auto Center — Estamos aqui para ayudarte!",
      text: "Hola {{name}},\n\nNos encantaria ayudarte a encontrar tu proximo carro. Responde para comenzar.\n\nSaludos,\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Nos encantaria ayudarte a encontrar tu proximo carro. Responde para comenzar.</p><p>Saludos,<br>Florida Auto Center</p>",
    },
    sms: {
      text: "Hola {{name}}, Florida Auto Center aqui. Nos encantaria ayudarte! Responde PARAR para cancelar.",
    },
  },
};

/**
 * Get a fallback template, replacing {{name}} with the lead's first name.
 */
export function getFallbackTemplate(
  name: string,
  channel: Channel,
  language: Language,
  templateType: string,
): FallbackTemplate {
  const key = `${channel}:${templateType}` as TemplateKey;
  const langTemplates = templates[language] ?? templates.EN;
  const template =
    langTemplates[key] ?? defaultFallback[language]?.[channel] ?? defaultFallback.EN[channel];

  const replace = (s: string) => s.replace(/\{\{name\}\}/g, name);

  return {
    subject: template.subject ? replace(template.subject) : undefined,
    text: replace(template.text),
    html: template.html ? replace(template.html) : undefined,
  };
}
