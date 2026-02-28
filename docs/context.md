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
  - Branding actual de extension: `WhatsWidget` (marca LeadWidget) con icono oficial de LeadWidget.
  - Popup con endpoint API fijo a produccion (sin edicion manual de URL/keys) para reducir errores operativos.
  - Acceso en popup por email/password (sin configuracion manual de Google/OAuth en UI final).
  - Incluye `content_script` en `web.whatsapp.com` para panel CRM embebido (sin auto-envio), con plantilla operativa seleccionable (`General` o `Inmobiliaria`):
    - modo `General`: playbook comercial, etiquetas sugeridas y atajos de etapa para ventas/servicios no inmobiliarios
    - modo `Inmobiliaria`: ficha de lead (operacion, tipo de propiedad, zona, presupuesto, fuente, urgencia), etiquetas sugeridas y atajos especializados (`Nuevo`, `Contactado`, `Visita`, `Oferta`, `Cierre`)
    - filtros de contactos por etapa operativa adaptados a la plantilla activa
    - tab `CRM` dentro del panel embebido con tablero Kanban (drag & drop) para mover leads entre etapas
    - creacion de etapas personalizadas desde el panel (persistidas por workspace en storage local) y asignacion por tags del lead
    - manejo defensivo de recarga de extension: evita crash del panel cuando Chrome invalida contexto durante update/reload
    - manejo global de `unhandledrejection/error` para suprimir `Extension context invalidated` durante hot-reload de extension
    - recordatorio rapido de seguimiento en horas
    - seguimiento manual asistido con limite diario de cumplimiento (`20/dia`, solo inserta texto)
    - tablero de "leads calientes hoy" con acceso rapido a ficha
    - tutorial guiado con checklist persistente (storage local de extension)
    - dock lateral + tabs para navegar modulos del panel, con atajos operativos (guardar lead, insertar plantilla, seguimiento rapido)
    - panel arrastrable por la barra superior; doble clic para resetear posicion automatica
    - modo privacidad `Blur demo` para ocultar chats/mensajes durante demos
    - bloque `Copiloto asistido` (sugerir respuesta, resumir lead, siguiente accion y derivacion humana) sin auto-envio
  - Incluye `background service worker` para revisar recordatorios vencidos y emitir notificaciones de escritorio (sin auto-envio).
  - Popup CRM agrega capacidades avanzadas sin romper contrato API:
    - Kanban real con drag & drop por etapas (actualiza stage via `PATCH /api/v1/leads/:leadId/stage`)
    - pestanas/segmentos personalizadas por workspace (filtros por tag, fuente, etapa, urgencia, agente)
    - apertura de chat a numero no guardado (`web.whatsapp.com/send?phone=...`) con envio manual
    - acceso directo a Google Calendar desde recordatorios (link prellenado)
    - validaciones operativas en popup: campanas solo con destinatarios `opted_in` y recordatorios con fecha/hora valida
    - importacion CSV de contactos al CRM via `POST /api/v1/leads/upsert`
    - selector de idioma en popup (`ES/EN/PT`)
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
  - `POST /api/v1/leads/upsert`
  - `PATCH /api/v1/leads/:leadId`
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
- Admin sync:
  - `POST /api/v1/admin/sync-subscription` (header `x-admin-sync-key`)
  - `POST /api/v1/admin/subscriptions-by-email` (header `x-admin-sync-key`)
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
- `ADMIN_SYNC_KEY` (token server-to-server para sincronizacion segura desde superadmin externo)
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`
- `MAX_CAMPAIGN_MESSAGES_PER_MINUTE`
- `MAX_CAMPAIGN_MESSAGES_PER_DAY`
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
- Limite diario por workspace para campanas (`MAX_CAMPAIGN_MESSAGES_PER_DAY`).
- El panel en WhatsApp Web solo inserta texto en composer; el envio final queda manual por el usuario.
- Recordatorios vencidos disparan notificacion local en Chrome (polling por `chrome.alarms`), con deduplicacion local para evitar alertas repetidas.
- Seguimientos asistidos desde panel embebido mantienen limite diario local (`20`) y no ejecutan envio automatico.
- CORS restringido por `APP_ORIGIN`.
- El endpoint `POST /api/v1/admin/sync-subscription` no usa sesion de usuario; exige secreto `x-admin-sync-key` para uso server-to-server.
- Requests desde `chrome-extension://*` estan permitidos para uso de extension local (load unpacked).
- Requests desde `https://web.whatsapp.com` estan permitidos para el panel embebido (content script).
- Firestore rules por defecto en modo backend-only (`allow false` para SDK cliente directo).

## Dependencias Criticas

- `express`
- `zod`
- `helmet`
- `cors`
- `dotenv`
- `firebase-admin`
