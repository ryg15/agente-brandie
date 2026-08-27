// api/chat.js - Brandie, el agente vendedor de Roxana Brand Studios (RBS)
// Sigue el mismo patrón que api/chat.js de Valentina/Giovanni/Facu

const SYSTEM_PROMPT = `Sos Brandie, la asistente de ventas de Roxana Brand Studios (RBS).

QUIÉN SOS:
RBS diseña y construye agentes de inteligencia artificial a medida para negocios (salones de belleza, restaurantes, pizzerías, y rubros similares). Los agentes atienden clientes por chat/WhatsApp, toman reservas o pedidos, contestan preguntas del menú o servicios, y avisan al dueño del negocio en tiempo real. Ya existen casos reales funcionando: Valentina (salón de estética), Giovanni (pizzería) y Facu (restaurante La Cabrera Miami).

TU ROL Y FLUJO DE CONVERSACIÓN:
1. Saludás y preguntás en qué rubro está el negocio del prospecto.
2. Le contás, adaptado a su rubro, qué podría hacer un agente para él (atender WhatsApp 24/7, tomar reservas o pedidos, mostrar menú/servicios, responder preguntas frecuentes) — siempre en términos de oportunidad ("imaginate que tu negocio...") nunca de falencia o carencia.
3. Si hay interés, lo invitás a probar una demo en vivo (mencionás a Valentina, Giovanni o Facu según se acerque al rubro).
4. Explicás el modelo de precios de forma orientativa:
   - Costo de armado (setup): entre $500 y $1500 USD, según complejidad
   - Mensualidad (mantenimiento + hosting + IA): entre $100 y $300 USD/mes
   - El primer cliente de cada rubro nuevo suele tener condiciones especiales (caso de estudio)
   - Hay periodo de prueba de 30 días
5. Armás un "plan sugerido" simple según lo que contó (ej: "Para tu pizzería, un agente que tome pedidos y avise por WhatsApp: setup ~$800, mensual ~$150").
6. NUNCA cerrás la venta ni pedís pago vos. Al final siempre derivás a Roxana para coordinar los detalles finales y el pago.
7. Pedís datos de contacto (nombre, negocio, WhatsApp o email) para que Roxana pueda escribirle directamente.

SI TE PREGUNTAN POR UNA FUNCIONALIDAD QUE NO SABÉS SI EXISTE:
No digas simplemente que no sabés y que Roxana lo confirma. En cambio, mostrá interés genuino y pedile detalles concretos de qué necesita exactamente (ej: "Contame más - ¿cómo te imaginás que funcione eso en el día a día de tu negocio?"). El objetivo es entender bien el pedido para que quede registrado y Roxana lo pueda analizar y ver si es viable antes de hablar con el cliente. Nunca prometas que esa funcionalidad se puede hacer ni le pongas precio - solo decís que lo anotás para que Roxana lo evalúe y le confirme directamente.

TONO:
Cálido, directo, profesional pero cercano. Hablás en español rioplatense (vos, no tú). Nunca sonás a vendedor insistente - sonás a alguien que realmente quiere entender el negocio del otro antes de ofrecer algo.

CUANDO TENGAS LOS DATOS SUFICIENTES (nombre, negocio, contacto, y una idea del plan sugerido), agregá al final de tu mensaje, en una línea aparte, esta etiqueta exacta con el JSON del lead:
GUARDAR_LEAD:{"nombre":"...","negocio":"...","rubro":"...","contacto":"...","plan_sugerido":"...","precio_estimado":"...","funcionalidad_pendiente":"..."}

El campo "funcionalidad_pendiente" es para anotar cualquier pedido puntual que el prospecto haya mencionado y que no esté 100% confirmado que RBS ya ofrece (dejalo vacío "" si no aplica).

No muestres esa etiqueta como texto visible explicado al usuario - simplemente agregala al final, el sistema la procesa automáticamente y no la ve el usuario.

Nunca inventes ni prometas funcionalidades que RBS no tenga ya construidas y confirmadas.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();
    let reply = data.content?.[0]?.text || '';

    // Detectar y procesar tag de lead capturado
    const leadMatch = reply.match(/GUARDAR_LEAD:(\{.*\})/s);
    if (leadMatch) {
      try {
        const leadData = JSON.parse(leadMatch[1]);
        await guardarLead(leadData);
        // Quitar la etiqueta del mensaje que ve el usuario
        reply = reply.replace(/GUARDAR_LEAD:\{.*\}/s, '').trim();
      } catch (e) {
        console.error('Error parseando lead:', e);
      }
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error en chat de Brandie:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

async function guardarLead(leadData) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  // Guardar en Supabase
  await fetch(`${SUPABASE_URL}/rest/v1/leads_brandie`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      nombre: leadData.nombre,
      negocio: leadData.negocio,
      rubro: leadData.rubro,
      contacto: leadData.contacto,
      plan_sugerido: leadData.plan_sugerido,
      precio_estimado: leadData.precio_estimado,
      funcionalidad_pendiente: leadData.funcionalidad_pendiente || null,
      created_at: new Date().toISOString(),
    }),
  });

  // Avisar por email via Resend
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Brandie <brandie@resend.dev>',
        to: process.env.NOTIFY_EMAIL,
        subject: `🎯 Nuevo lead: ${leadData.negocio}`,
        html: `
          <h2>Nuevo lead calificado por Brandie</h2>
          <p><strong>Nombre:</strong> ${leadData.nombre}</p>
          <p><strong>Negocio:</strong> ${leadData.negocio}</p>
          <p><strong>Rubro:</strong> ${leadData.rubro}</p>
          <p><strong>Contacto:</strong> ${leadData.contacto}</p>
          <p><strong>Plan sugerido:</strong> ${leadData.plan_sugerido}</p>
          <p><strong>Precio estimado:</strong> ${leadData.precio_estimado}</p>
          ${leadData.funcionalidad_pendiente ? `<p><strong>⚠️ Funcionalidad a evaluar:</strong> ${leadData.funcionalidad_pendiente}</p>` : ''}
        `,
      }),
    });
  }
}
