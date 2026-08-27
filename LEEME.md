# Brandie — Setup y deploy

## 1. Supabase (proyecto nuevo, plan free)
1. Creá un proyecto nuevo en supabase.com (o usá uno existente).
2. Andá a SQL Editor y corré el contenido de `supabase_setup.sql`.
3. Guardá: `SUPABASE_URL` y la `service_role key` (Settings → API).

## 2. Resend (plan free, opcional pero recomendado)
1. Creá cuenta en resend.com.
2. Sacá tu `RESEND_API_KEY`.
3. Definí a qué email querés que te avise (`NOTIFY_EMAIL`, ej: el tuyo).

## 3. Variables de entorno en Vercel
Al deployar, agregá estas env vars en el proyecto de Vercel:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY` (opcional)
- `NOTIFY_EMAIL` (tu email)

## 4. Deploy (mismo flujo que ya usás)
```
cd brandie
npx vercel --prod
```
Cuando te pregunte, elegí crear un proyecto nuevo (ej: `brandie-rbs`).
Te va a quedar en algo como `brandie-rbs.vercel.app` — gratis.

## 5. Pendiente de tu lado
- Completar los links de Giovanni y Facu en `index.html` (líneas de `href="#"`)
  con las URLs reales donde estén deployados, para que el prospecto los pruebe en vivo.
- Si más adelante querés dominio propio (rbsagents.com), simplemente lo apuntás
  a este mismo proyecto de Vercel — no hay que tocar código.

---

## Scout — el agente prospector

Busca negocios reales por rubro + ciudad en Google Places, arma una ficha con
nombre, teléfono, dirección y rating, y le genera un mensaje de primer contacto
sugerido. Vos revisás y mandás el mensaje manualmente desde tu WhatsApp — Scout
nunca envía nada solo (así no arriesgás que te bloqueen la cuenta).

### Setup adicional

1. **Corré `prospectos_setup.sql`** en el SQL Editor de Supabase (mismo proyecto de Brandie).
2. **Conseguí una API key de Google Places:**
   - Andá a console.cloud.google.com → creá un proyecto (o usá uno existente)
   - Habilitá "Places API (New)"
   - Creá una API key en "Credenciales" y restringila a esa API
   - Activá facturación (Google pide tarjeta, pero da ~$200 USD de crédito
     mensual gratis — para uso normal de prospección no vas a pagar nada al
     principio)
3. **Agregá la variable de entorno en Vercel:**
   - `GOOGLE_PLACES_API_KEY`
4. Abrí `admin-prospectos.html` en el navegador (ej: `tu-proyecto.vercel.app/admin-prospectos.html`),
   poné un rubro y una ciudad, y apretá Buscar.

### Cómo usarlo día a día
- Buscás por rubro + ciudad (ej: "pizzería" + "Miami, FL")
- Se arma una ficha por cada negocio encontrado, con mensaje sugerido listo para copiar
- Copiás el mensaje, lo pegás en WhatsApp y se lo mandás vos misma
- Marcás el estado (Nuevo / Contactado / Descartado) para no perder el hilo

