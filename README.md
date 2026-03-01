# whatsapp-crm-compliant

CRM WhatsApp MVP para cobro mensual base de S/50, con backend deployable en Vercel y persistencia en Firestore.

## Estado actual

- API productiva: `https://whats-crm-compliant.vercel.app`
- Firebase project: `whats-crm-compliant-2026`
- Firestore DB: `(default)` en `nam5`
- Firebase Web App: `1:301448363673:web:46c2ec5300453960b80208`
- Extension MV3 lista para uso local (load unpacked) o distribucion por ZIP

## Features

- Auth multiusuario por workspace (`owner`, `agent`) + login Google (Firebase Auth)
- Suscripcion mensual por workspace
- Leads, pipeline, notas, plantillas, campanas y recordatorios
- Compliance Trust Center (opt-in coverage, riesgo anti-spam, cuota diaria y auditoria reciente)
- Panel CRM embebido en `web.whatsapp.com` (lead rapido + notas + recordatorios + insertar plantilla)
- Webhook WhatsApp (Cloud API opcional, `dry_run` fallback)
- Bloqueo CRM si suscripcion no activa
- Limites de cumplimiento para campanas: por minuto y por dia
- Preflight de campanas (bloquea lotes con alto riesgo de incumplimiento)
- Persistencia en Firestore (ya no memoria)

## Estructura

- `apps/api`: backend Node.js + TypeScript
- `apps/extension`: extension Chrome MV3
- `docs/context.md`: arquitectura
- `docs/PROJECT_CONTEXT.md`: resumen operacional
- `docs/contract.md`: contrato API
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`: config Firebase
- `vercel.json`: despliegue serverless en Vercel

## Requisitos

- Node.js 20+
- npm 10+
- Firebase CLI (`firebase --version`)
- Vercel CLI (`vercel --version`)

## Ejecutar local

```bash
cd apps/api
cmd /c npm install
copy .env.example .env
cmd /c npm run dev
```

API local: `http://localhost:4001`

## Variables de entorno API

Base:

- `APP_ORIGIN`
- `PLAN_MONTHLY_PRICE_PEN`
- `BILLING_PERIOD_DAYS`
- `SESSION_TTL_DAYS`
- `MAX_CAMPAIGN_MESSAGES_PER_MINUTE`
- `MAX_CAMPAIGN_MESSAGES_PER_DAY`
- `MAX_CAMPAIGN_NON_OPTIN_PERCENT`
- `MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`

Firebase (una opcion):

1. Recomendada en Vercel:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON completo de cuenta de servicio)
   - `FIREBASE_PROJECT_ID`
2. Alternativa:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Firebase CLI (ya aplicado en este proyecto)

Comandos usados:

```bash
firebase projects:create whats-crm-compliant-2026 --display-name "Whats CRM Compliant"
firebase --project whats-crm-compliant-2026 deploy --only firestore
```

Esto habilito Firestore API, creo la DB default y desplego rules/indexes.

## Firebase Auth Google (requerido para login Google)

1. Firebase Console -> Authentication -> `Get started` (si aparece) y luego Sign-in method -> habilitar `Google`.
2. En Google Cloud Console, crear OAuth Client ID para la extension.
3. Agregar redirect URI de extension:
   - `https://<EXTENSION_ID>.chromiumapp.org/oauth2`
4. En el popup de la extension guardar:
   - `Google OAuth Client ID`
   - `Firebase Web API Key` (ya viene prellenado por defecto para este proyecto)

## Vercel CLI (ya aplicado en este proyecto)

Comandos usados:

```bash
vercel project add whats-crm-compliant --non-interactive
vercel link --yes --project whats-crm-compliant --scope afiliados-pro-s-projects
vercel deploy --prod --yes --scope afiliados-pro-s-projects
```

URL final:

- `https://whats-crm-compliant.vercel.app`

## Scripts utiles

```bash
npm run api:build
npm run api:check
npm run extension:zip
npm run firebase:firestore:deploy
npm run vercel:deploy:prod
```

## Extension Chrome

1. Ir a `chrome://extensions`
2. Activar `Developer mode`
3. `Load unpacked`
4. Seleccionar `apps/extension`
5. En el popup, definir `API Base URL`:
   - Local: `http://localhost:4001/api/v1`
   - Produccion: `https://whats-crm-compliant.vercel.app/api/v1`
6. (Opcional Google login) Completar:
   - `Google OAuth Client ID`
   - `Firebase Web API Key`
7. Usar boton `Continuar con Google`.
8. Ir a `https://web.whatsapp.com` y usar el panel flotante `CRM WhatsApp` dentro del chat.

## ZIP de extension

```bash
powershell -ExecutionPolicy Bypass -File .\apps\extension\package-extension.ps1
```

Salida:

- `dist/whatsapp-crm-compliant-extension.zip`

## Cumplimiento

- No automatiza envio en `web.whatsapp.com` (solo inserta texto; el usuario envia manualmente)
- Envio masivo solo a `opted_in`
- Limite diario configurable por workspace (`MAX_CAMPAIGN_MESSAGES_PER_DAY`)
- Errores estructurados sin filtrar secretos
