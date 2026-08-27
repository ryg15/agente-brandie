// api/buscar-prospectos.js - Scout, el agente prospector de RBS
// Busca negocios reales por rubro + ciudad en Google Places, arma una ficha
// y un mensaje de outreach sugerido para cada uno. Roxana lo manda a mano.

const MENSAJE_SYSTEM_PROMPT = `Sos Brandie, de Roxana Brand Studios (RBS). Vas a escribir un primer mensaje corto de WhatsApp para contactar en frío a un negocio, presentando que RBS construye agentes de IA a medida para atender clientes.

Reglas:
- Máximo 3-4 líneas.
- Tono cálido, directo, nada de venta agresiva. Español rioplatense (vos).
- Mencioná el nombre del negocio y algo específico de su rubro para que no suene genérico.
- Terminá con una pregunta simple que invite a responder (no un cierre de venta).
- No prometas precios ni funcionalidades específicas en este primer mensaje - es solo para abrir la conversación.
- Devolvé SOLO el texto del mensaje, sin comillas ni explicación adicional.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rubro, ciudad } = req.body;
    if (!rubro || !ciudad) {
      return res.status(400).json({ error: 'Falta rubro o ciudad' });
    }

    const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const query = encodeURIComponent(`${rubro} en ${ciudad}`);

    const placesRes = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_KEY,
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating',
        },
        body: JSON.stringify({ textQuery: `${rubro} en ${ciudad}`, languageCode: 'es' }),
      }
    );

    const placesData = await placesRes.json();
    const lugares = placesData.places || [];

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    const fichas = [];

    for (const lugar of lugares) {
      const nombre = lugar.displayName?.text || 'Sin nombre';
      const telefono = lugar.nationalPhoneNumber || lugar.internationalPhoneNumber || '';
      const direccion = lugar.formattedAddress || '';
      const website = lugar.websiteUri || '';
      const rating = lugar.rating || null;

      // Generar mensaje sugerido con Claude
      let mensaje = '';
      try {
        const msgRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 200,
            system: MENSAJE_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: `Negocio: ${nombre}. Rubro: ${rubro}. Ciudad: ${ciudad}.`,
              },
            ],
          }),
        });
        const msgData = await msgRes.json();
        mensaje = msgData.content?.[0]?.text?.trim() || '';
      } catch (e) {
        console.error('Error generando mensaje para', nombre, e);
      }

      const ficha = {
        nombre_negocio: nombre,
        telefono,
        direccion,
        rubro,
        ciudad,
        website,
        rating,
        mensaje_sugerido: mensaje,
        estado: 'nuevo',
      };

      // Guardar en Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/prospectos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(ficha),
      });

      fichas.push(ficha);
    }

    return res.status(200).json({ encontrados: fichas.length, fichas });
  } catch (error) {
    console.error('Error en Scout:', error);
    return res.status(500).json({ error: 'Error interno buscando prospectos' });
  }
};
