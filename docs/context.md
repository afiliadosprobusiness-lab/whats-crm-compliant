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
  - `compliance` (trust center + rate limit por usuario/minuto + estado de modo dual CRM/Cloud API)
  - `analytics` (dashboard operativo de productividad, funnel y conversion por agente/etapa)
  - `audit` (bitacora trazable de eventos de cumplimiento/operacion)
  - `whatsapp` (webhooks/envio)
- `apps/extension`: extension Chrome MV3 (popup) para operacion comercial diaria.
  - Branding actual de extension: `WhatsWidget` (marca LeadWidget) con icono oficial de LeadWidget.
  - Popup con `BACKEND_URL` gestionado internamente (persistido en storage local con fallback seguro a produccion); la edicion manual queda oculta en UI final para evitar errores operativos.
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
    - barra de estado/atajos CRM ubicada junto al input (debajo del composer) con estado vivo de lead/compliance/modo y atajos (`Guardar`, `Resumen`, `CRM`)
    - barra de acciones sobre la caja de mensaje con accesos rapidos (`Plantilla`, `Sugerir + insertar`, `Seguimiento`, `Recordatorio +24h`) y guia contextual por accion/requisitos
    - sincronizacion dinamica de datos del workspace (templates/leads/reminders/compliance) sin recargar pagina, con auto-refresh por intervalo y al volver foco/visibilidad
    - sincronizacion instantanea popup -> panel embebido via `chrome.storage` (`crm_workspace_refresh_tick`) para reflejar cambios en caliente tras guardar entidades
    - modo privacidad `Blur demo` para ocultar chats/mensajes durante demos
    - bloque `Copiloto asistido` (sugerir respuesta, resumir lead, siguiente accion y derivacion humana) sin auto-envio
    - `Compliance Trust Center` visible en panel (estado compliant, riesgo y alertas principales)
    - `Messaging Mode` visible en panel (`crm_manual` vs `cloud_api`, con indicador de proveedor/fallback `dry_run`)
    - bandeja multiagente en panel (`my`, `unassigned`, `overdue`, `all`) con acciones de asignacion y health events
    - resumen operativo de productividad en panel (funnel por etapa + top agentes con carga y vencidos)
  - Incluye `background service worker` para revisar recordatorios vencidos y emitir notificaciones de escritorio (sin auto-envio).
  - Popup CRM agrega capacidades avanzadas sin romper contrato API:
    - Kanban real con drag & drop por etapas (actualiza stage via `PATCH /api/v1/leads/:leadId/stage`)
    - pestanas/segmentos personalizadas por workspace (filtros por tag, fuente, etapa, urgencia, agente)
    - apertura de chat a numero no guardado (`web.whatsapp.com/send?phone=...`) con envio manual
    - acceso directo a Google Calendar desde recordatorios (link prellenado)
    - validaciones operativas en popup: campanas solo con destinatarios `opted_in` y recordatorios con fecha/hora valida
    - preflight de campana previo al envio (score de riesgo + bloqueos explicados)
    - trust center con cobertura opt-in, cuota diaria, riesgo anti-spam y auditoria reciente
    - estado visible de `Messaging Mode` (`crm_manual` vs `cloud_api`) con fallback explicito a `dry_run`
    - bandejas multiagente (`my`, `unassigned`, `overdue`, `all`) consumiendo `GET /api/v1/leads/inbox`
    - asignacion de owner por lead (`PATCH /api/v1/leads/:leadId/assign`) y eventos de health score (`POST /api/v1/leads/:leadId/health-events`)
    - dashboard de productividad (`GET /api/v1/analytics/productivity`) con KPIs operativos, funnel y resumen por agente
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
  - `GET /api/v1/leads` (query `view` opcional)
  - `GET /api/v1/leads/inbox`
  - `POST /api/v1/leads/upsert`
  - `PATCH /api/v1/leads/:leadId`
  - `PATCH /api/v1/leads/:leadId/stage`
  - `PATCH /api/v1/leads/:leadId/assign`
  - `POST /api/v1/leads/:leadId/health-events`
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
  - `POST /api/v1/campaigns/preflight`
  - `GET /api/v1/campaigns`
  - `POST /api/v1/campaigns/:campaignId/preflight`
  - `POST /api/v1/campaigns/:campaignId/send`
- Recordatorios:
  - `POST /api/v1/reminders`
  - `GET /api/v1/reminders`
  - `PATCH /api/v1/reminders/:reminderId/complete`
- Compliance:
  - `GET /api/v1/compliance/trust-center`
  - `GET /api/v1/compliance/messaging-mode`
  - `POST /api/v1/compliance/manual-assist`
- Analytics:
  - `GET /api/v1/analytics/productivity`
- Webhooks:
  - `GET /api/v1/webhooks/whatsapp`
  - `POST /api/v1/webhooks/whatsapp`
  - `GET /api/v1/webhooks/whatsapp/events`

## Variables de Entorno

- `PORT`
- `APP_ORIGIN` (uno o varios origins separados por coma para front web)
- `ADMIN_SYNC_KEY` (token server-to-server para sincronizacion segura desde superadmin externo)
- `CRM_MESSAGING_MODE` (`crm_manual` | `cloud_api`, default `crm_manual`)
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`
- `MAX_CAMPAIGN_MESSAGES_PER_MINUTE`
- `MAX_CAMPAIGN_MESSAGES_PER_DAY`
- `MAX_CAMPAIGN_NON_OPTIN_PERCENT`
- `MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE`
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
- Preflight bloquea campanas si el porcentaje sin opt-in supera `MAX_CAMPAIGN_NON_OPTIN_PERCENT` (default 20%).
- Modo de mensajeria dual: `cloud_api` solo se resuelve si hay credenciales completas; caso contrario fuerza `dry_run` en `crm_manual`.
- Acciones de Copiloto asistido limitadas por usuario/minuto (`MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE`).
- El panel en WhatsApp Web solo inserta texto en composer; el envio final queda manual por el usuario.
- Recordatorios vencidos disparan notificacion local en Chrome (polling por `chrome.alarms`), con deduplicacion local para evitar alertas repetidas.
- Recordatorios permiten cierre manual trazable (`PATCH /api/v1/reminders/:reminderId/complete`).
- Seguimientos asistidos desde panel embebido mantienen limite diario local (`20`) y no ejecutan envio automatico.
- Eventos criticos de CRM/compliance se registran en `audit_logs` para trazabilidad operativa.
- CORS restringido por `APP_ORIGIN`.
- El endpoint `POST /api/v1/admin/sync-subscription` no usa sesion de usuario; exige secreto `x-admin-sync-key` para uso server-to-server.
- Endpoints de webhook (`/api/v1/webhooks/*`) quedan fuera de auth/subscription middleware para permitir verificacion/recepcion desde Meta.
- Requests desde `chrome-extension://*` estan permitidos para uso de extension local (load unpacked).
- Requests desde `https://web.whatsapp.com` estan permitidos para el panel embebido (content script).
- Firestore rules por defecto en modo backend-only (`allow false` para SDK cliente directo).
- Extension comparte `BACKEND_URL` por storage key `crm_backend_url` (sin hardcode obligatorio en runtime).

## Dependencias Criticas

- `express`
- `zod`
- `helmet`
- `cors`
- `dotenv`
- `firebase-admin`
