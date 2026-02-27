# Contexto Arquitectonico

## Objetivo

Construir un CRM de WhatsApp MVP, inspirado en extensiones comerciales tipo DragonChat, pero simplificado y orientado a cumplimiento.

## Arquitectura

- `apps/api`: API REST modular (Node.js/Express + TypeScript) con modulos:
  - `auth` (registro/login/sesiones/usuarios por workspace, incluyendo Google via Firebase Auth)
  - `billing` (estado y renovacion de suscripcion)
  - `leads`
  - `templates`
  - `campaigns`
  - `reminders`
  - `whatsapp` (webhooks/envio)
- `apps/extension`: extension Chrome MV3 (popup) para operacion comercial diaria.
- Persistencia actual: Firestore (colecciones por modulo).
- Runtime de despliegue: Vercel Serverless (`apps/api/src/vercel.ts` + `vercel.json`).

## Integraciones Externas

- WhatsApp Cloud API (opcional por credenciales).
- Fallback `dry_run` para demo/pruebas sin credenciales.
- Firebase/Firestore (admin SDK) para persistencia duradera.
- Firebase Authentication (Google provider) para login social opcional.
- Vercel para despliegue del backend.

## Endpoints Principales

- `GET /health`
- Leads:
  - (protegidos por auth + suscripcion activa)
  - `POST /api/v1/leads`
  - `GET /api/v1/leads`
  - `PATCH /api/v1/leads/:leadId/stage`
  - `POST /api/v1/leads/:leadId/notes`
- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/google`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/users`
  - `POST /api/v1/auth/users`
- Billing:
  - `GET /api/v1/billing/subscription`
  - `POST /api/v1/billing/renew`
- Templates:
  - `POST /api/v1/templates`
  - `GET /api/v1/templates`
- Campanas:
  - `POST /api/v1/campaigns`
  - `GET /api/v1/campaigns`
  - `POST /api/v1/campaigns/:campaignId/send`
- Recordatorios:
  - `POST /api/v1/reminders`
  - `GET /api/v1/reminders`
- Webhooks:
  - `GET /api/v1/webhooks/whatsapp`
  - `POST /api/v1/webhooks/whatsapp`
  - `GET /api/v1/webhooks/whatsapp/events`

## Variables de Entorno

- `PORT`
- `APP_ORIGIN` (uno o varios origins separados por coma para front web)
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`
- `MAX_CAMPAIGN_MESSAGES_PER_MINUTE`
- `PLAN_MONTHLY_PRICE_PEN`
- `BILLING_PERIOD_DAYS`
- `SESSION_TTL_DAYS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Reglas de Seguridad

- Validacion de entrada con Zod en todos los endpoints.
- Errores estructurados (sin stack traces al cliente).
- Autenticacion por bearer token de sesion.
- Login Google requiere `idToken` emitido por Firebase Auth con `sign_in_provider=google.com`.
- Si Firebase Auth aun no esta inicializado, se debe ejecutar `Get started` en Firebase Console > Authentication.
- Autorizacion por rol (`owner`, `agent`) para acciones administrativas.
- Gate de suscripcion activa para operaciones CRM.
- Envio masivo restringido a leads `opted_in`.
- Throttling basico por minuto para campanas.
- CORS restringido por `APP_ORIGIN`.
- Requests desde `chrome-extension://*` estan permitidos para uso de extension local (load unpacked).
- Firestore rules por defecto en modo backend-only (`allow false` para SDK cliente directo).

## Dependencias Criticas

- `express`
- `zod`
- `helmet`
- `cors`
- `dotenv`
- `firebase-admin`
