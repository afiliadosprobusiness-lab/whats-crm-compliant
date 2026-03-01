# Resumen Operacional

Proyecto: `whatsapp-crm-compliant`

- Tipo: CRM WhatsApp MVP.
- Inspiracion funcional: flujo comercial de extensiones tipo DragonChat (panel operativo, embudo, plantillas, campanas), simplificado.
- Cumplimiento: no automatiza DOM de WhatsApp Web; opera por backend + Cloud API opcional.
- Backend deployado: `https://whats-crm-compliant.vercel.app`.
- Firebase activo: `whats-crm-compliant-2026` con Firestore default (`nam5`).
- CORS backend permite origenes web definidos en `APP_ORIGIN`, `chrome-extension://*` (popup) y `https://web.whatsapp.com` (panel embebido).

## Modulos MVP Actuales

1. Auth multiusuario:
   - Registro owner por empresa.
   - Login/logout por token bearer.
   - Endpoint Google Auth disponible en API (`POST /api/v1/auth/google`) para integraciones controladas.
   - Gestion de usuarios del workspace (owner crea agentes).
2. Suscripcion:
   - Estado por workspace.
   - Renovacion mensual (S/50 base) por endpoint.
   - Bloqueo del CRM cuando vence la suscripcion.
   - Sincronizacion administrativa server-to-server por email (`POST /api/v1/admin/sync-subscription`) para activar/desactivar acceso desde superadmin externo.
3. Leads:
   - Alta con consentimiento.
   - Upsert por telefono (`POST /api/v1/leads/upsert`) para evitar duplicados al operar desde WhatsApp Web.
   - Actualizacion parcial (`PATCH /api/v1/leads/:leadId`) de etapa/consentimiento/tags/nombre.
   - Cambio de etapa (`new`, `contacted`, `qualified`, `won`, `lost`).
   - Bandejas operativas por vista (`GET /api/v1/leads/inbox` con `my/unassigned/overdue/all`).
   - Asignacion de lead a agente (`PATCH /api/v1/leads/:leadId/assign`).
   - Eventos de Health Score (`POST /api/v1/leads/:leadId/health-events`) con SLA de primera respuesta y seguimiento.
   - Notas por lead.
4. Plantillas:
   - Creacion y listado.
5. Campanas:
   - Creacion por plantilla + leads.
   - Preflight de cumplimiento (`POST /api/v1/campaigns/preflight` y `POST /api/v1/campaigns/:campaignId/preflight`).
   - Envio con limite por minuto.
   - Limite diario por workspace para cumplimiento.
   - Bloqueo para leads sin `opted_in` y bloqueo preventivo si >20% del lote no tiene opt-in.
6. Recordatorios:
   - Creacion por lead con fecha/hora.
   - Cierre manual trazable (`PATCH /api/v1/reminders/:reminderId/complete`).
   - Notificacion de escritorio en Chrome cuando el recordatorio vence (sin auto-envio).
7. Compliance:
   - `Trust Center` (`GET /api/v1/compliance/trust-center`) con cobertura opt-in, cuota diaria, riesgo anti-spam y auditoria reciente.
   - Estado de modo dual (`GET /api/v1/compliance/messaging-mode`) con `crm_manual` vs `cloud_api` y fallback explicito a `dry_run`.
   - Rate limiter por usuario/minuto para acciones asistidas (`POST /api/v1/compliance/manual-assist`).
8. Analytics:
   - Dashboard de productividad (`GET /api/v1/analytics/productivity`) con funnel por etapa, conversion y leaderboard por agente.
9. Auditoria:
   - Bitacora `audit_logs` para eventos de leads/campanas/recordatorios/compliance.
10. Webhooks:
   - Verificacion y recepcion de eventos de WhatsApp.
11. Infra:
   - Persistencia Firestore para modulos core.
   - Runtime Vercel serverless (`apps/api/src/vercel.ts`).

## Frontend de Extension

- Popup unico con:
  - Marca de extension: `WhatsWidget` (by LeadWidget), con icono de LeadWidget en `apps/extension/icon.png`.
  - `BACKEND_URL` gestionado en segundo plano (persistido en `crm_backend_url`) con fallback seguro a backend productivo; campo oculto en UI de usuario final para evitar configuraciones incorrectas.
  - Login/registro owner.
  - Panel embebido en `web.whatsapp.com` via content script (lead rapido, notas, recordatorios, insertar plantilla).
  - Panel embebido con selector de plantilla operativa por workspace (`General` o `Inmobiliaria`):
    - `General`: playbook comercial, etiquetas sugeridas y atajos de pipeline para ventas/servicios generales.
    - `Inmobiliaria`: etiquetas sugeridas, atajos de pipeline, ficha de perfil y seguimiento rapido por horas.
  - Panel embebido agrega bloque `Contactos por etapa` con filtros operativos adaptados a la plantilla activa y lista clickeable de leads del workspace.
  - Panel embebido incluye tab `CRM` con tablero Kanban (drag & drop) para mover leads entre etapas desde WhatsApp Web.
  - Panel embebido permite crear etapas personalizadas (persistidas por workspace en storage local) y aplicarlas al lead actual sin romper las etapas core del backend.
  - Panel embebido incluye guardas para `Extension context invalidated` durante recarga/update de extension (no rompe la UI).
  - Panel embebido suprime errores globales `Extension context invalidated` en `unhandledrejection/error` para evitar ruido en runtime al recargar extension.
  - Seguimiento manual asistido en panel embebido con limite diario local de cumplimiento (`20/dia`), siempre con envio manual.
  - Panel embebido con UX modular: dock lateral + tabs, tutorial con checklist persistente y vista de leads calientes del dia.
  - Dock lateral con atajos operativos: guardar lead rapido, insertar plantilla y crear seguimiento rapido.
  - Panel embebido arrastrable; doble clic en la barra superior reinicia posicion automatica.
  - Panel embebido agrega barra superior nativa (debajo del header del chat) con estado vivo de lead/compliance/modo y atajos (`Guardar`, `Resumen`, `CRM`).
  - Panel embebido agrega barra de acciones sobre la caja de mensaje con atajos (`Plantilla`, `Sugerir + insertar`, `Seguimiento`, `Recordatorio +24h`) manteniendo envio manual.
  - Panel embebido sincroniza datos en caliente sin recargar (templates/leads/reminders/compliance), con auto-refresh por intervalo y refresco inmediato al recuperar foco.
  - `background service worker` de extension para polling de recordatorios vencidos (`chrome.alarms`) y alertas nativas (`chrome.notifications`).
  - Estado de sesion.
  - Estado de suscripcion (badge Activo/Inactivo); activacion/renovacion se gestiona desde superadmin.
  - KPIs basicos.
  - Form de leads.
  - Form/lista de plantillas.
  - Form de campana y envio.
  - Form/lista de recordatorios.
  - Vista embudo por etapas con Kanban drag & drop (mover leads entre columnas).
  - Modulo `Pestanas personalizadas` en popup (segmentos por tag/fuente/etapa/urgencia/agente) persistido por workspace.
  - Modulo `Numero no guardado` para abrir chat por E.164 con envio siempre manual.
  - Modulo `Importar CSV a CRM` (upsert de leads por telefono via API, sin scraping de WhatsApp).
  - Recordatorios en popup incluyen CTA a Google Calendar (link prellenado).
  - Popup endurece validaciones: campanas solo con seleccion valida de leads `opted_in` y recordatorios requieren fecha/hora valida.
  - Popup agrega `Compliance Trust Center`: badge global `Compliant Mode ON`, cobertura opt-in, cuota diaria, riesgo anti-spam y auditoria reciente.
  - Popup agrega bloque `Messaging Mode` para mostrar modo efectivo (`crm_manual`/`cloud_api`) y estado de `dry_run`.
  - Popup agrega `Inbox multiagente` con filtros (`Mis leads`, `Sin asignar`, `Vencidos`, `Todos`), asignacion de owner y eventos rapidos de health score.
  - Popup agrega `Dashboard de productividad` (KPIs operativos, funnel por etapa y resumen por agente).
  - Popup ejecuta preflight antes de enviar campanas y muestra bloqueos/recomendaciones.
  - Selector de idioma en popup (`ES/EN/PT`).
  - Panel embebido incluye `Blur demo` para privacidad visual en demos.
  - Panel embebido agrega `Copiloto asistido` (sugerencias/resumen/siguiente accion/derivacion), sin auto-envio y con rate limiter por usuario/minuto desde backend.
  - Panel embebido muestra estado de cumplimiento (`Compliant Mode ON` + riesgo) en tiempo real.
  - Panel embebido muestra `Messaging Mode` efectivo (`crm_manual`/`cloud_api`) y proveedor (`dry_run`/`whatsapp_cloud_api`).
  - Panel embebido agrega `Bandeja multiagente` (Mis leads, Sin asignar, Vencidos, Todos) con asignacion de owner y health events rapidos.
  - Panel embebido agrega bloque de `Productividad` (funnel por etapa y resumen de agentes con carga/vencidos).

## Estado

- Funcional para cobro mensual y operacion real.
- En WhatsApp Web no hay auto-envio: la extension inserta mensajes y el usuario confirma envio manual.
- Seguimientos asistidos aplican control local de limite diario para cumplimiento (20 inserciones manuales por dia).
- Copiloto asistido aplica control adicional backend por usuario/minuto (`MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE`).
- El modo dual queda visible en tiempo real: si `CRM_MESSAGING_MODE=cloud_api` sin credenciales completas, la API cae a `crm_manual` + `dry_run`.
- Superadmin externo puede reconciliar estado real de suscripcion por lote de correos via `POST /api/v1/admin/subscriptions-by-email`.
- Firebase Auth Google requiere activar `Get started` + provider `Google` en Firebase Console si aun no se hizo.
- Pendiente para robustez enterprise: cola de envios, observabilidad avanzada, billing automatizado real, rotacion de claves y backups operativos.
