# Contexto Arquitectonico

## Objetivo

Construir un CRM de WhatsApp MVP, inspirado en extensiones comerciales tipo DragonChat, pero simplificado y orientado a cumplimiento.

## Arquitectura

- `apps/api`: API REST modular (Node.js/Express + TypeScript) con modulos:
  - `auth` (registro/login/sesiones/usuarios por workspace)
  - `billing` (estado y renovacion de suscripcion)
  - `leads`
  - `templates`
  - `campaigns`
  - `reminders`
  - `whatsapp` (webhooks/envio)
- `apps/extension`: extension Chrome MV3 (popup) para operacion comercial diaria.
- Persistencia actual: memoria (MVP). Produccion: migrar a Postgres + cola.

## Integraciones Externas

- WhatsApp Cloud API (opcional por credenciales).
- Fallback `dry_run` para demo/pruebas sin credenciales.

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
- `APP_ORIGIN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`
- `MAX_CAMPAIGN_MESSAGES_PER_MINUTE`
- `PLAN_MONTHLY_PRICE_PEN`
- `BILLING_PERIOD_DAYS`
- `SESSION_TTL_DAYS`

## Reglas de Seguridad

- Validacion de entrada con Zod en todos los endpoints.
- Errores estructurados (sin stack traces al cliente).
- Autenticacion por bearer token de sesion.
- Autorizacion por rol (`owner`, `agent`) para acciones administrativas.
- Gate de suscripcion activa para operaciones CRM.
- Envio masivo restringido a leads `opted_in`.
- Throttling basico por minuto para campanas.
- CORS restringido por `APP_ORIGIN`.

## Dependencias Criticas

- `express`
- `zod`
- `helmet`
- `cors`
- `dotenv`
