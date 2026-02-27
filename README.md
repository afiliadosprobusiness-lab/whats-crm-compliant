# whatsapp-crm-compliant

MVP de CRM para WhatsApp orientado a cobro mensual base de S/50, inspirado en flujos comerciales tipo DragonChat pero sin automatizar WhatsApp Web.

## Que incluye

- Auth multiusuario por workspace (`owner`, `agent`).
- Suscripcion mensual por workspace (precio base configurable, default S/50).
- Bloqueo del CRM cuando la suscripcion vence.
- Leads con embudo comercial y notas.
- Plantillas y campanas masivas con limite por minuto.
- Recordatorios de seguimiento.
- Webhook de WhatsApp (Cloud API opcional + `dry_run`).
- Extension Chrome MV3 local para operar todo desde popup.

## Estructura

- `apps/api`: backend Node.js + TypeScript.
- `apps/extension`: extension MV3.
- `docs/context.md`: contexto tecnico fuente de verdad.
- `docs/PROJECT_CONTEXT.md`: resumen operacional.
- `docs/contract.md`: contrato de endpoints.

## Requisitos

- Node.js 20+
- npm 10+

## Levantar API

```bash
cd apps/api
cmd /c npm install
copy .env.example .env
cmd /c npm run dev
```

API: `http://localhost:4001`.

## Cargar extension en Chrome

1. Ir a `chrome://extensions`.
2. Activar `Developer mode`.
3. Click en `Load unpacked`.
4. Seleccionar `apps/extension`.

## Generar ZIP de la extension

Desde la raiz del proyecto:

```bash
powershell -ExecutionPolicy Bypass -File .\apps\extension\package-extension.ps1
```

Salida:

- `dist/whatsapp-crm-compliant-extension.zip`

Ese ZIP te sirve para distribuir a clientes para instalacion manual en modo developer.

## Flujo comercial rapido (S/50)

1. Owner se registra en el popup.
2. Crea agentes (`POST /api/v1/auth/users`) si necesita equipo.
3. Revisa estado en suscripcion.
4. Renueva por un mes con `POST /api/v1/billing/renew` (ejemplo `amountPen: 50`).
5. Opera CRM (leads, templates, campanas, recordatorios).

## Cumplimiento

- No scraping ni automatizacion de `web.whatsapp.com`.
- Envio masivo solo a leads `opted_in`.
- Errores estructurados y sin fuga de secretos.

