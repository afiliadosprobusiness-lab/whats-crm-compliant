# Resumen Operacional

Proyecto: `whatsapp-crm-compliant`

- Tipo: CRM WhatsApp MVP.
- Inspiracion funcional: flujo comercial de extensiones tipo DragonChat (panel operativo, embudo, plantillas, campanas), simplificado.
- Cumplimiento: no automatiza DOM de WhatsApp Web; opera por backend + Cloud API opcional.
- Backend deployado: `https://whats-crm-compliant.vercel.app`.
- Firebase activo: `whats-crm-compliant-2026` con Firestore default (`nam5`).

## Modulos MVP Actuales

1. Auth multiusuario:
   - Registro owner por empresa.
   - Login/logout por token bearer.
   - Gestion de usuarios del workspace (owner crea agentes).
2. Suscripcion:
   - Estado por workspace.
   - Renovacion mensual (S/50 base) por endpoint.
   - Bloqueo del CRM cuando vence la suscripcion.
3. Leads:
   - Alta con consentimiento.
   - Cambio de etapa (`new`, `contacted`, `qualified`, `won`, `lost`).
   - Notas por lead.
4. Plantillas:
   - Creacion y listado.
5. Campanas:
   - Creacion por plantilla + leads.
   - Envio con limite por minuto.
   - Bloqueo para leads sin `opted_in`.
6. Recordatorios:
   - Creacion por lead con fecha/hora.
7. Webhooks:
   - Verificacion y recepcion de eventos de WhatsApp.
8. Infra:
   - Persistencia Firestore para modulos core.
   - Runtime Vercel serverless (`apps/api/src/vercel.ts`).

## Frontend de Extension

- Popup unico con:
  - Config de `API Base URL` (local o Vercel).
  - Login/registro owner.
  - Estado de sesion.
  - Estado y renovacion de suscripcion.
  - KPIs basicos.
  - Form de leads.
  - Form/lista de plantillas.
  - Form de campana y envio.
  - Form/lista de recordatorios.
  - Vista embudo por etapas.

## Estado

- Funcional para cobro mensual y operacion real.
- Pendiente para robustez enterprise: cola de envios, observabilidad avanzada, billing automatizado real, rotacion de claves y backups operativos.

