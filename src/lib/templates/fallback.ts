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
    "whatsapp:value_proposition": {
      text: "{{name}}, here's why customers choose us: free CARFAX on every vehicle, flexible financing, and a no-pressure experience. Can I show you what we have?",
    },
    "whatsapp:inventory_update": {
      text: "Hey {{name}}! Just a heads up — we got new vehicles in this week that might be exactly what you're looking for. Want me to send you some options?",
    },
    "whatsapp:super_hot_intro": {
      text: "Hi {{name}}! This is Antonio from Florida Auto Center. We just got some vehicles in that I think you'd love — I set one aside for you. Can I send you the details?",
    },
    "whatsapp:super_hot_human_touch": {
      text: "{{name}}, I'd love to personally help you find the right car. Would you prefer a call or to come visit us? I can work around your schedule.",
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
    "email:super_hot_offer": {
      subject: "{{name}}, we reserved something special for you",
      text: "Hi {{name}},\n\nWe have exclusive conditions available for a limited time — including special financing rates and new arrivals that just hit the lot.\n\nI'd love to show you what we have. Reply to this email or call us to schedule a visit.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We have <strong>exclusive conditions</strong> available for a limited time — including special financing rates and new arrivals that just hit the lot.</p><p>I'd love to show you what we have. Reply to this email or call us to schedule a visit.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:financing_options": {
      subject: "{{name}}, flexible financing options at Florida Auto Center",
      text: "Hi {{name}},\n\nDid you know we offer flexible financing options? Whether you have great credit or are rebuilding, we work with multiple lenders to find the best rate for you.\n\nReply to this email to learn more about your options.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>Did you know we offer <strong>flexible financing options</strong>? Whether you have great credit or are rebuilding, we work with multiple lenders to find the best rate for you.</p><p>Reply to this email to learn more about your options.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:new_arrivals": {
      subject: "{{name}}, new vehicles just arrived!",
      text: "Hi {{name}},\n\nWe just got some exciting new additions to our lot. Fresh inventory means more choices and great deals.\n\nWant to see what's new? Reply to this email or stop by Florida Auto Center.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We just got some exciting <strong>new additions</strong> to our lot. Fresh inventory means more choices and great deals.</p><p>Want to see what's new? Reply to this email or stop by Florida Auto Center.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:last_touch_email": {
      subject: "{{name}}, one last thing from Florida Auto Center",
      text: "Hi {{name}},\n\nI don't want to fill your inbox, so this will be my last message for a while. Just know that whenever you're ready to explore your options, we're here for you — no pressure, no rush.\n\nWishing you all the best!\n\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>I don't want to fill your inbox, so this will be my last message for a while. Just know that whenever you're ready to explore your options, we're here for you — no pressure, no rush.</p><p>Wishing you all the best!</p><p>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:long_time_reconnect": {
      subject: "{{name}}, it's been a while!",
      text: "Hi {{name}},\n\nIt's been quite some time since we connected. A lot has changed at Florida Auto Center — new inventory, better financing options, and the same great service.\n\nIf you're ever in the market again, we'd love to help.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>It's been quite some time since we connected. A lot has changed at Florida Auto Center — new inventory, better financing options, and the same great service.</p><p>If you're ever in the market again, we'd love to help.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── Nurture Emails ───
    "email:nurture_new_inventory": {
      subject: "New vehicles at Florida Auto Center",
      text: "Hi {{name}},\n\nJust a quick update — we have new vehicles on the lot that might catch your eye. No pressure, just wanted to keep you in the loop.\n\nBest,\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>Just a quick update — we have <strong>new vehicles</strong> on the lot that might catch your eye. No pressure, just wanted to keep you in the loop.</p><p>Best,<br>Florida Auto Center</p>",
    },
    "email:nurture_market_update": {
      subject: "Auto market update from Florida Auto Center",
      text: "Hi {{name}},\n\nHere's what's happening in the auto market: prices are shifting and there are some great opportunities right now. If you're thinking about a vehicle, this could be a good time.\n\nBest,\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>Here's what's happening in the auto market: prices are shifting and there are some great opportunities right now. If you're thinking about a vehicle, this could be a good time.</p><p>Best,<br>Florida Auto Center</p>",
    },
    "email:nurture_seasonal": {
      subject: "{{name}}, seasonal specials at Florida Auto Center",
      text: "Hi {{name}},\n\nWe're running seasonal specials right now with great deals on select vehicles. If the timing is right for you, we'd love to help.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>We're running <strong>seasonal specials</strong> right now with great deals on select vehicles. If the timing is right for you, we'd love to help.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_reconnect": {
      subject: "{{name}}, still here for you at Florida Auto Center",
      text: "Hi {{name}},\n\nJust a friendly check-in from Florida Auto Center. We're still here whenever you're ready. Our inventory changes regularly, so feel free to reach out anytime.\n\nBest,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>Just a friendly check-in from Florida Auto Center. We're still here whenever you're ready. Our inventory changes regularly, so feel free to reach out anytime.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_annual": {
      subject: "{{name}}, a year-end hello from Florida Auto Center",
      text: "Hi {{name}},\n\nIt's been a while! Just wanted to say hello and let you know Florida Auto Center is here if you ever need us. We'd love to help you find your next vehicle.\n\nAll the best,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hi {{name}},</p><p>It's been a while! Just wanted to say hello and let you know Florida Auto Center is here if you ever need us. We'd love to help you find your next vehicle.</p><p>All the best,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:quick_checkin": {
      text: "Hi {{name}}, quick check-in from Florida Auto Center. Need help finding a car? We're here! Reply STOP to opt out.",
    },
    "sms:nurture_checkin": {
      text: "Hi {{name}}, Florida Auto Center here. Still thinking about a vehicle? We're here when you're ready. Reply STOP to opt out.",
    },
    "sms:short_followup": {
      text: "Hi {{name}}, still looking for a car? Florida Auto Center has great options. Reply STOP to opt out.",
    },
    "sms:last_touch": {
      text: "{{name}}, we're here when you're ready! Florida Auto Center - Reply STOP to opt out.",
    },
    "sms:super_hot_sms": {
      text: "{{name}}, exclusive conditions available for 48h at Florida Auto Center. Reply YES for details. Reply STOP to opt out.",
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
    "whatsapp:value_proposition": {
      text: "{{name}}, por que nossos clientes nos escolhem: CARFAX gratis em todos os veiculos, financiamento flexivel e experiencia sem pressao. Posso te mostrar?",
    },
    "whatsapp:inventory_update": {
      text: "Oi {{name}}! Chegaram veiculos novos essa semana que podem ser exatamente o que voce procura. Quer que eu te mande algumas opcoes?",
    },
    "whatsapp:super_hot_intro": {
      text: "Oi {{name}}! Aqui e o Antonio da Florida Auto Center. Chegaram uns veiculos que acho que vao te interessar muito — separei um especialmente pra voce. Posso te mostrar?",
    },
    "whatsapp:super_hot_human_touch": {
      text: "{{name}}, gostaria de te ajudar pessoalmente a encontrar o carro certo. Prefere que eu ligue ou quer vir nos visitar? Me adapto ao seu horario.",
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
    "email:super_hot_offer": {
      subject: "{{name}}, reservamos algo especial pra voce",
      text: "Oi {{name}},\n\nTemos condicoes exclusivas por tempo limitado — incluindo taxas especiais de financiamento e novidades no estoque.\n\nAdoraria te mostrar. Responda este email ou ligue pra agendar uma visita.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Temos <strong>condicoes exclusivas</strong> por tempo limitado — incluindo taxas especiais de financiamento e novidades no estoque.</p><p>Adoraria te mostrar. Responda este email ou ligue pra agendar uma visita.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:financing_options": {
      subject: "{{name}}, opcoes de financiamento na Florida Auto Center",
      text: "Oi {{name}},\n\nSabia que oferecemos financiamento flexivel? Seja com credito otimo ou em reconstrucao, trabalhamos com varios bancos pra encontrar a melhor taxa pra voce.\n\nResponda este email pra saber mais.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Sabia que oferecemos <strong>financiamento flexivel</strong>? Seja com credito otimo ou em reconstrucao, trabalhamos com varios bancos pra encontrar a melhor taxa pra voce.</p><p>Responda este email pra saber mais.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:new_arrivals": {
      subject: "{{name}}, veiculos novos acabaram de chegar!",
      text: "Oi {{name}},\n\nAcabamos de receber novidades no estoque. Mais opcoes e otimas oportunidades.\n\nQuer ver o que chegou? Responda ou passe na Florida Auto Center.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Acabamos de receber <strong>novidades no estoque</strong>. Mais opcoes e otimas oportunidades.</p><p>Quer ver o que chegou? Responda ou passe na Florida Auto Center.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:last_touch_email": {
      subject: "{{name}}, uma ultima mensagem da Florida Auto Center",
      text: "Oi {{name}},\n\nNao quero encher sua caixa de entrada, entao essa sera minha ultima mensagem por um tempo. Saiba que quando voce estiver pronto, estamos aqui — sem pressao.\n\nTudo de bom!\n\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Nao quero encher sua caixa de entrada, entao essa sera minha ultima mensagem por um tempo. Saiba que quando voce estiver pronto, estamos aqui — sem pressao.</p><p>Tudo de bom!</p><p>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:long_time_reconnect": {
      subject: "{{name}}, faz tempo que nao nos falamos!",
      text: "Oi {{name}},\n\nFaz bastante tempo que nos conectamos. Muita coisa mudou na Florida Auto Center — estoque novo, melhores opcoes de financiamento e o mesmo otimo atendimento.\n\nSe estiver pensando em carro, adorariamos ajudar.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Faz bastante tempo que nos conectamos. Muita coisa mudou na Florida Auto Center — estoque novo, melhores opcoes de financiamento e o mesmo otimo atendimento.</p><p>Se estiver pensando em carro, adorariamos ajudar.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── Nurture Emails ───
    "email:nurture_new_inventory": {
      subject: "Novos veiculos na Florida Auto Center",
      text: "Oi {{name}},\n\nSo pra avisar — temos veiculos novos que podem te interessar. Sem pressao, so queria manter voce informado.\n\nAbraco,\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>So pra avisar — temos <strong>veiculos novos</strong> que podem te interessar. Sem pressao, so queria manter voce informado.</p><p>Abraco,<br>Florida Auto Center</p>",
    },
    "email:nurture_market_update": {
      subject: "Novidades do mercado automotivo — Florida Auto Center",
      text: "Oi {{name}},\n\nVeja o que esta acontecendo no mercado automotivo: os precos estao mudando e ha otimas oportunidades agora. Se estiver pensando em um veiculo, pode ser um bom momento.\n\nAbraco,\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Veja o que esta acontecendo no mercado automotivo: os precos estao mudando e ha otimas oportunidades agora. Se estiver pensando em um veiculo, pode ser um bom momento.</p><p>Abraco,<br>Florida Auto Center</p>",
    },
    "email:nurture_seasonal": {
      subject: "{{name}}, ofertas da temporada na Florida Auto Center",
      text: "Oi {{name}},\n\nEstamos com ofertas especiais da temporada em veiculos selecionados. Se o momento for certo pra voce, adorariamos ajudar.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Estamos com <strong>ofertas especiais da temporada</strong> em veiculos selecionados. Se o momento for certo pra voce, adorariamos ajudar.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_reconnect": {
      subject: "{{name}}, ainda estamos aqui na Florida Auto Center",
      text: "Oi {{name}},\n\nSo um oi da Florida Auto Center. Continuamos aqui quando voce estiver pronto. Nosso estoque muda regularmente, entao fique a vontade pra entrar em contato.\n\nAbraco,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>So um oi da Florida Auto Center. Continuamos aqui quando voce estiver pronto. Nosso estoque muda regularmente, entao fique a vontade pra entrar em contato.</p><p>Abraco,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_annual": {
      subject: "{{name}}, um oi de fim de ano da Florida Auto Center",
      text: "Oi {{name}},\n\nFaz um tempo! So queria dar um oi e lembrar que a Florida Auto Center esta aqui se precisar. Adorariamos ajudar voce a encontrar seu proximo veiculo.\n\nTudo de bom,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Oi {{name}},</p><p>Faz um tempo! So queria dar um oi e lembrar que a Florida Auto Center esta aqui se precisar. Adorariamos ajudar voce a encontrar seu proximo veiculo.</p><p>Tudo de bom,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:quick_checkin": {
      text: "Oi {{name}}, um oi rapido da Florida Auto Center. Procurando carro? Estamos aqui! Responda PARAR para cancelar.",
    },
    "sms:nurture_checkin": {
      text: "Oi {{name}}, Florida Auto Center aqui. Ainda pensando em veiculo? Estamos aqui quando precisar. Responda PARAR para cancelar.",
    },
    "sms:short_followup": {
      text: "Oi {{name}}, ainda procurando carro? Florida Auto Center tem otimas opcoes. Responda PARAR para cancelar.",
    },
    "sms:last_touch": {
      text: "{{name}}, estamos aqui quando voce estiver pronto! Florida Auto Center - Responda PARAR para cancelar.",
    },
    "sms:super_hot_sms": {
      text: "{{name}}, condicoes exclusivas por 48h na Florida Auto Center. Responda SIM para detalhes. Responda PARAR para cancelar.",
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
    "whatsapp:value_proposition": {
      text: "{{name}}, por que nos eligen nuestros clientes: CARFAX gratis en cada vehiculo, financiamiento flexible y experiencia sin presion. Te muestro lo que tenemos?",
    },
    "whatsapp:inventory_update": {
      text: "Hola {{name}}! Llegaron vehiculos nuevos esta semana que podrian ser justo lo que buscas. Quieres que te envie opciones?",
    },
    "whatsapp:super_hot_intro": {
      text: "Hola {{name}}! Soy Antonio de Florida Auto Center. Llegaron unos vehiculos que creo que te van a encantar — separe uno especialmente para ti. Te muestro los detalles?",
    },
    "whatsapp:super_hot_human_touch": {
      text: "{{name}}, me gustaria ayudarte personalmente a encontrar el carro perfecto. Prefieres que te llame o quieres visitarnos? Me adapto a tu horario.",
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
    "email:super_hot_offer": {
      subject: "{{name}}, reservamos algo especial para ti",
      text: "Hola {{name}},\n\nTenemos condiciones exclusivas por tiempo limitado — incluyendo tasas especiales de financiamiento y nuevas llegadas.\n\nMe encantaria mostrarte. Responde este email o llamanos para agendar una visita.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Tenemos <strong>condiciones exclusivas</strong> por tiempo limitado — incluyendo tasas especiales de financiamiento y nuevas llegadas.</p><p>Me encantaria mostrarte. Responde este email o llamanos para agendar una visita.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:financing_options": {
      subject: "{{name}}, opciones de financiamiento en Florida Auto Center",
      text: "Hola {{name}},\n\nSabias que ofrecemos financiamiento flexible? Sea que tengas excelente credito o estes reconstruyendo, trabajamos con multiples prestamistas para encontrar la mejor tasa para ti.\n\nResponde a este email para saber mas.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Sabias que ofrecemos <strong>financiamiento flexible</strong>? Sea que tengas excelente credito o estes reconstruyendo, trabajamos con multiples prestamistas para encontrar la mejor tasa para ti.</p><p>Responde a este email para saber mas.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:new_arrivals": {
      subject: "{{name}}, vehiculos nuevos acaban de llegar!",
      text: "Hola {{name}},\n\nAcabamos de recibir nuevas adiciones a nuestro lote. Inventario fresco significa mas opciones y excelentes ofertas.\n\nQuieres ver lo nuevo? Responde o visitanos en Florida Auto Center.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Acabamos de recibir <strong>nuevas adiciones</strong> a nuestro lote. Inventario fresco significa mas opciones y excelentes ofertas.</p><p>Quieres ver lo nuevo? Responde o visitanos en Florida Auto Center.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:last_touch_email": {
      subject: "{{name}}, un ultimo mensaje de Florida Auto Center",
      text: "Hola {{name}},\n\nNo quiero llenar tu bandeja, asi que este sera mi ultimo mensaje por un tiempo. Solo quiero que sepas que cuando estes listo, estamos aqui — sin presion.\n\nTe deseo lo mejor!\n\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>No quiero llenar tu bandeja, asi que este sera mi ultimo mensaje por un tiempo. Solo quiero que sepas que cuando estes listo, estamos aqui — sin presion.</p><p>Te deseo lo mejor!</p><p>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:long_time_reconnect": {
      subject: "{{name}}, ha pasado mucho tiempo!",
      text: "Hola {{name}},\n\nHa pasado bastante tiempo desde que nos conectamos. Mucho ha cambiado en Florida Auto Center — inventario nuevo, mejores opciones de financiamiento y el mismo gran servicio.\n\nSi alguna vez estas en el mercado, nos encantaria ayudar.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Ha pasado bastante tiempo desde que nos conectamos. Mucho ha cambiado en Florida Auto Center — inventario nuevo, mejores opciones de financiamiento y el mismo gran servicio.</p><p>Si alguna vez estas en el mercado, nos encantaria ayudar.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── Nurture Emails ───
    "email:nurture_new_inventory": {
      subject: "Nuevos vehiculos en Florida Auto Center",
      text: "Hola {{name}},\n\nSolo una actualizacion rapida — tenemos vehiculos nuevos que podrian interesarte. Sin presion, solo queria mantenerte informado.\n\nSaludos,\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Solo una actualizacion rapida — tenemos <strong>vehiculos nuevos</strong> que podrian interesarte. Sin presion, solo queria mantenerte informado.</p><p>Saludos,<br>Florida Auto Center</p>",
    },
    "email:nurture_market_update": {
      subject: "Novedades del mercado automotriz — Florida Auto Center",
      text: "Hola {{name}},\n\nEsto es lo que esta pasando en el mercado automotriz: los precios estan cambiando y hay excelentes oportunidades ahora. Si estas pensando en un vehiculo, podria ser un buen momento.\n\nSaludos,\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Esto es lo que esta pasando en el mercado automotriz: los precios estan cambiando y hay excelentes oportunidades ahora. Si estas pensando en un vehiculo, podria ser un buen momento.</p><p>Saludos,<br>Florida Auto Center</p>",
    },
    "email:nurture_seasonal": {
      subject: "{{name}}, ofertas de temporada en Florida Auto Center",
      text: "Hola {{name}},\n\nTenemos ofertas especiales de temporada en vehiculos seleccionados. Si el momento es el correcto para ti, nos encantaria ayudar.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Tenemos <strong>ofertas especiales de temporada</strong> en vehiculos seleccionados. Si el momento es el correcto para ti, nos encantaria ayudar.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_reconnect": {
      subject: "{{name}}, seguimos aqui en Florida Auto Center",
      text: "Hola {{name}},\n\nSolo un saludo amigable de Florida Auto Center. Seguimos aqui cuando estes listo. Nuestro inventario cambia regularmente, asi que no dudes en contactarnos.\n\nSaludos,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Solo un saludo amigable de Florida Auto Center. Seguimos aqui cuando estes listo. Nuestro inventario cambia regularmente, asi que no dudes en contactarnos.</p><p>Saludos,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    "email:nurture_annual": {
      subject: "{{name}}, un saludo de fin de ano de Florida Auto Center",
      text: "Hola {{name}},\n\nHa pasado un tiempo! Solo queria saludar y recordarte que Florida Auto Center esta aqui si nos necesitas. Nos encantaria ayudarte a encontrar tu proximo vehiculo.\n\nTodo lo mejor,\nAntonio Sanches\nFlorida Auto Center",
      html: "<p>Hola {{name}},</p><p>Ha pasado un tiempo! Solo queria saludar y recordarte que Florida Auto Center esta aqui si nos necesitas. Nos encantaria ayudarte a encontrar tu proximo vehiculo.</p><p>Todo lo mejor,<br>Antonio Sanches<br>Florida Auto Center</p>",
    },
    // ─── SMS ───
    "sms:quick_checkin": {
      text: "Hola {{name}}, un saludo rapido de Florida Auto Center. Buscando carro? Estamos aqui! Responde PARAR para cancelar.",
    },
    "sms:nurture_checkin": {
      text: "Hola {{name}}, Florida Auto Center aqui. Aun pensando en vehiculo? Estamos aqui cuando estes listo. Responde PARAR para cancelar.",
    },
    "sms:short_followup": {
      text: "Hola {{name}}, sigues buscando carro? Florida Auto Center tiene excelentes opciones. Responde PARAR para cancelar.",
    },
    "sms:last_touch": {
      text: "{{name}}, estamos aqui cuando estes listo! Florida Auto Center - Responde PARAR para cancelar.",
    },
    "sms:super_hot_sms": {
      text: "{{name}}, condiciones exclusivas por 48h en Florida Auto Center. Responde SI para detalles. Responde PARAR para cancelar.",
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
