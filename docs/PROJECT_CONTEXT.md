# Resumen Operacional

Proyecto: `whatsapp-crm-compliant`

- Tipo: CRM WhatsApp MVP.
- Inspiracion funcional: flujo comercial de extensiones tipo DragonChat (panel operativo, embudo, plantillas, campanas), pero simplificado.
- Cumplimiento: no automatiza DOM de WhatsApp Web; opera por backend + Cloud API opcional.

## Modulos MVP Actuales

1. Auth multiusuario:
   - Registro owner por empresa.
   - Login/logout por token bearer.
   - Gestion de usuarios del workspace (owner crea agentes).
2. Suscripcion:
   - Estado de suscripcion por workspace.
   - Renovacion mensual (S/50 base) por endpoint.
   - Bloqueo de uso CRM cuando la suscripcion vence.
1. Leads:
   - Alta de lead con consentimiento.
   - Cambio de etapa (`new`, `contacted`, `qualified`, `won`, `lost`).
   - Notas por lead.
2. Plantillas:
   - Creacion y listado.
3. Campanas:
   - Creacion por plantilla + leads.
   - Envio con limite por minuto.
   - Bloqueo para leads sin `opted_in`.
4. Recordatorios:
   - Creacion por lead con fecha/hora.
5. Webhooks:
   - Verificacion y recepcion de eventos de WhatsApp.

## Frontend de Extension

- Popup único con:
  - Login/registro owner
  - Estado de sesion
  - Estado y renovacion de suscripcion
  - KPIs basicos
  - Form de leads
  - Form/lista de plantillas
  - Form de campana y envio
  - Form/lista de recordatorios
  - Vista embudo por etapas

## Estado

- Funcional para demo comercial y cobro mensual inicial.
- Falta para produccion: DB persistente, pasarela de pago real, auditoria y observabilidad.
