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
   - Notas por lead.
4. Plantillas:
   - Creacion y listado.
5. Campanas:
   - Creacion por plantilla + leads.
   - Envio con limite por minuto.
   - Limite diario por workspace para cumplimiento.
   - Bloqueo para leads sin `opted_in`.
6. Recordatorios:
   - Creacion por lead con fecha/hora.
   - Notificacion de escritorio en Chrome cuando el recordatorio vence (sin auto-envio).
7. Webhooks:
   - Verificacion y recepcion de eventos de WhatsApp.
8. Infra:
   - Persistencia Firestore para modulos core.
   - Runtime Vercel serverless (`apps/api/src/vercel.ts`).

## Frontend de Extension

- Popup unico con:
  - Marca de extension: `WhatsWidget` (by LeadWidget), con icono de LeadWidget en `apps/extension/icon.png`.
  - Configuracion bloqueada a backend productivo (`https://whats-crm-compliant.vercel.app/api/v1`) para evitar errores por edicion manual.
  - Login/registro owner.
  - Panel embebido en `web.whatsapp.com` via content script (lead rapido, notas, recordatorios, insertar plantilla).
  - Panel embebido con flujo inmobiliario: etiquetas sugeridas, atajos de pipeline, ficha de perfil y seguimiento rapido por horas.
  - Seguimiento manual asistido en panel embebido con limite diario local de cumplimiento (`20/dia`), siempre con envio manual.
  - Panel embebido con UX modular: dock lateral + tabs, tutorial con checklist persistente y vista de leads calientes del dia.
  - Dock lateral con atajos operativos: guardar lead rapido, insertar plantilla y crear seguimiento rapido.
  - Panel embebido arrastrable; doble clic en la barra superior reinicia posicion automatica.
  - `background service worker` de extension para polling de recordatorios vencidos (`chrome.alarms`) y alertas nativas (`chrome.notifications`).
  - Estado de sesion.
  - Estado de suscripcion (badge Activo/Inactivo); activacion/renovacion se gestiona desde superadmin.
  - KPIs basicos.
  - Form de leads.
  - Form/lista de plantillas.
  - Form de campana y envio.
  - Form/lista de recordatorios.
  - Vista embudo por etapas.

## Estado

- Funcional para cobro mensual y operacion real.
- En WhatsApp Web no hay auto-envio: la extension inserta mensajes y el usuario confirma envio manual.
- Seguimientos asistidos aplican control local de limite diario para cumplimiento (20 inserciones manuales por dia).
- Superadmin externo puede reconciliar estado real de suscripcion por lote de correos via `POST /api/v1/admin/subscriptions-by-email`.
- Firebase Auth Google requiere activar `Get started` + provider `Google` en Firebase Console si aun no se hizo.
- Pendiente para robustez enterprise: cola de envios, observabilidad avanzada, billing automatizado real, rotacion de claves y backups operativos.
