# Contrato API

Base URL: `http://localhost:4001`

## Formato de Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload invalido",
    "details": {}
  },
  "requestId": "req_..."
}
```

## Auth

### `POST /api/v1/auth/register`

Request:

```json
{
  "companyName": "Mi Negocio",
  "name": "Ken",
  "email": "ken@demo.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "token": "sess_...",
  "user": {
    "id": "usr_...",
    "workspaceId": "ws_...",
    "name": "Ken",
    "email": "ken@demo.com",
    "role": "owner"
  },
  "workspace": {
    "id": "ws_...",
    "companyName": "Mi Negocio",
    "planMonthlyPricePen": 50,
    "subscriptionStatus": "active",
    "currentPeriodEnd": "2026-03-29T00:00:00.000Z"
  }
}
```

Posibles errores adicionales:
- `429 RATE_LIMITED` si se excede limite temporal de intentos de registro.

### `POST /api/v1/auth/login`

Request:

```json
{
  "email": "ken@demo.com",
  "password": "secret123"
}
```

Response `200`: mismo shape que register.

Posibles errores adicionales:
- `429 RATE_LIMITED` si se excede limite temporal de intentos de login.

### `POST /api/v1/auth/google`

Request:

```json
{
  "idToken": "firebase_id_token",
  "companyName": "Mi Negocio (opcional para primer login)"
}
```

Response `200`: mismo shape que register/login.

Posibles errores adicionales:
- `429 RATE_LIMITED` si se excede limite temporal de intentos con Google.

### `GET /api/v1/auth/me`

Header: `Authorization: Bearer <token>`

Response `200`:

```json
{
  "user": {},
  "workspace": {},
  "sessionToken": "sess_..."
}
```

### `POST /api/v1/auth/logout`

Header: `Authorization: Bearer <token>`

Response `200`:

```json
{
  "ok": true
}
```

### `GET /api/v1/auth/users`

Header: `Authorization: Bearer <token>`

Response `200`:

```json
{
  "users": []
}
```

### `POST /api/v1/auth/users`

Header: `Authorization: Bearer <token>` (solo `owner`)

Request:

```json
{
  "name": "Asesor",
  "email": "asesor@demo.com",
  "password": "secret123",
  "role": "agent"
}
```

Response `201`:

```json
{
  "user": {}
}
```

## Billing

### `GET /api/v1/billing/subscription`

Header: `Authorization: Bearer <token>`

Response `200`:

```json
{
  "subscription": {
    "workspaceId": "ws_...",
    "planMonthlyPricePen": 50,
    "subscriptionStatus": "active",
    "currentPeriodEnd": "2026-03-29T00:00:00.000Z",
    "canUseCrm": true,
    "recentPayments": []
  }
}
```

### `POST /api/v1/billing/renew`

Header: `Authorization: Bearer <token>` (solo `owner`)

Request:

```json
{
  "months": 1,
  "amountPen": 50
}
```

## Admin Sync (server-to-server)

### `POST /api/v1/admin/sync-subscription`

Header requerido:

- `x-admin-sync-key: <ADMIN_SYNC_KEY>`

Request:

```json
{
  "email": "agencia@test.com",
  "enabled": true,
  "months": 1
}
```

Reglas:

- `email` debe existir en usuarios del CRM Extension.
- `enabled=true` activa suscripcion y extiende periodo por `months` (default `1`).
- `enabled=false` marca suscripcion en `past_due` y bloquea acceso CRM.

Response `200`:

```json
{
  "ok": true,
  "email": "agencia@test.com",
  "userId": "usr_...",
  "workspaceId": "ws_...",
  "subscription": {
    "subscriptionStatus": "active",
    "currentPeriodStart": "2026-02-27T15:00:00.000Z",
    "currentPeriodEnd": "2026-03-29T15:00:00.000Z",
    "canUseCrm": true
  }
}
```

Posibles errores:

- `401 UNAUTHORIZED` si falta o no coincide `x-admin-sync-key`.
- `404 NOT_FOUND` si no existe usuario/workspace para ese email.
- `503 INTERNAL_ERROR` si el servidor no tiene `ADMIN_SYNC_KEY` configurado.

### `POST /api/v1/admin/subscriptions-by-email`

Header requerido:

- `x-admin-sync-key: <ADMIN_SYNC_KEY>`

Request:

```json
{
  "emails": ["agencia@test.com", "equipo@test.com"]
}
```

Reglas:

- Acepta `1..100` correos por request.
- No modifica estado, solo consulta estado real de suscripcion por email.

Response `200`:

```json
{
  "results": [
    {
      "email": "agencia@test.com",
      "found": true,
      "userId": "usr_...",
      "workspaceId": "ws_...",
      "subscriptionStatus": "active",
      "currentPeriodEnd": "2026-03-29T15:00:00.000Z",
      "canUseCrm": true
    }
  ]
}
```

Posibles errores:

- `401 UNAUTHORIZED` si falta o no coincide `x-admin-sync-key`.
- `503 INTERNAL_ERROR` si el servidor no tiene `ADMIN_SYNC_KEY` configurado.

Response `200`:

```json
{
  "workspace": {},
  "payment": {
    "id": "pay_...",
    "amountPen": 50
  }
}
```

## CRM (requiere auth + suscripcion activa)

### `POST /api/v1/leads`

Request:

```json
{
  "name": "Cliente Demo",
  "phoneE164": "+51999999999",
  "consentStatus": "opted_in",
  "consentSource": "form_web",
  "stage": "new",
  "tags": ["nuevo"]
}
```

Response `201`:

```json
{
  "lead": {}
}
```

Campos aditivos del objeto `lead` (compatibilidad preservada):

- `opted_in: boolean`
- `opted_in_at: string | null` (ISO)
- `opted_in_source: string | null`
- `ownerUserId: string | null`
- `assignedAt: string | null` (ISO)
- `firstResponseAt: string | null` (ISO)
- `lastFollowupAt: string | null` (ISO)
- `healthScore: number` (0..100)
- `healthTemperature: "hot" | "warm" | "cold"`
- `healthUpdatedAt: string | null` (ISO)
- `latestHealthEvent: string | null`
- `sla: { firstResponseDueAt, firstResponseBreached, followupDueAt, followupBreached }`

### `GET /api/v1/leads`

Query opcional:

- `view: all | my | unassigned | overdue`

Response `200`:

```json
{
  "leads": []
}
```

### `GET /api/v1/leads/inbox`

Query opcional:

- `view: all | my | unassigned | overdue`

Response `200`:

```json
{
  "inbox": {
    "view": "my",
    "counts": {
      "all": 120,
      "my": 35,
      "unassigned": 20,
      "overdue": 14
    },
    "leads": []
  }
}
```

### `POST /api/v1/leads/upsert`

Request:

```json
{
  "name": "Cliente Demo",
  "phoneE164": "+51999999999",
  "consentStatus": "opted_in",
  "consentSource": "whatsapp_web_manual",
  "stage": "qualified",
  "tags": ["comprador", "departamento"]
}
```

Response `200`:

```json
{
  "lead": {}
}
```

### `PATCH /api/v1/leads/:leadId`

Request (campos opcionales):

```json
{
  "stage": "contacted",
  "consentStatus": "opted_in",
  "tags": ["comprador", "urgente"]
}
```

Response `200`:

```json
{
  "lead": {}
}
```

### `PATCH /api/v1/leads/:leadId/stage`

Request:

```json
{
  "stage": "qualified"
}
```

Response `200`:

```json
{
  "lead": {}
}
```

### `POST /api/v1/leads/:leadId/notes`

Request:

```json
{
  "note": "Seguimiento en 48 horas"
}
```

Response `200`:

```json
{
  "lead": {}
}
```

### `PATCH /api/v1/leads/:leadId/assign`

Request:

```json
{
  "ownerUserId": "usr_..." 
}
```

Notas:

- `ownerUserId: null` desasigna el lead.
- `ownerUserId` debe pertenecer al mismo workspace.

Response `200`:

```json
{
  "lead": {}
}
```

### `POST /api/v1/leads/:leadId/health-events`

Request:

```json
{
  "event": "responded",
  "note": "Respondio y pidio cotizacion"
}
```

Valores permitidos en `event`:

- `responded`
- `appointment_set`
- `manual_followup`
- `no_response_72h`
- `spam_reported`
- `won`
- `lost`

Response `200`:

```json
{
  "lead": {}
}
```

### `POST /api/v1/templates`

Request:

```json
{
  "name": "Promo bienvenida",
  "body": "Hola {{name}}, tenemos una oferta."
}
```

Response `201`:

```json
{
  "template": {}
}
```

### `GET /api/v1/templates`

Response `200`:

```json
{
  "templates": []
}
```

### `POST /api/v1/campaigns`

Request:

```json
{
  "name": "Promo Marzo",
  "templateId": "tpl_1",
  "recipientLeadIds": ["lead_1", "lead_2"]
}
```

Response `201`:

```json
{
  "campaign": {}
}
```

### `GET /api/v1/campaigns`

Response `200`:

```json
{
  "campaigns": []
}
```

### `POST /api/v1/campaigns/preflight`

Request:

```json
{
  "name": "Promo Marzo",
  "templateId": "tpl_1",
  "recipientLeadIds": ["lead_1", "lead_2"]
}
```

Response `200`:

```json
{
  "preflight": {
    "canSend": true,
    "blockers": [],
    "risk": {
      "score": 15,
      "level": "low",
      "reasons": []
    }
  }
}
```

### `POST /api/v1/campaigns/:campaignId/preflight`

Response `200`:

```json
{
  "preflight": {
    "canSend": true,
    "blockers": [],
    "risk": {
      "score": 15,
      "level": "low",
      "reasons": []
    }
  }
}
```

### `POST /api/v1/campaigns/:campaignId/send`

Response `200`:

```json
{
  "campaign": {},
  "results": []
}
```

Posibles errores adicionales:
- `429 RATE_LIMITED` cuando el workspace supera `MAX_CAMPAIGN_MESSAGES_PER_DAY`.
- `409 CONFLICT` cuando el preflight de cumplimiento bloquea el lote (ej: >20% sin opt-in).

### `POST /api/v1/reminders`

Request:

```json
{
  "leadId": "lead_1",
  "note": "Llamar manana",
  "dueAt": "2026-03-01T16:00:00.000Z"
}
```

Response `201`:

```json
{
  "reminder": {}
}
```

### `GET /api/v1/reminders`

Response `200`:

```json
{
  "reminders": []
}
```

### `PATCH /api/v1/reminders/:reminderId/complete`

Response `200`:

```json
{
  "reminder": {
    "status": "done",
    "completedAt": "2026-03-01T16:10:00.000Z",
    "completedByUserId": "usr_..."
  }
}
```

## Compliance

### `GET /api/v1/compliance/trust-center`

Response `200`:

```json
{
  "trustCenter": {
    "compliantMode": "on",
    "optInCoverage": {
      "totalLeads": 120,
      "optedInLeads": 95,
      "percentage": 79.17
    },
    "campaignDailyQuota": {
      "maxPerDay": 200,
      "sentToday": 45,
      "remaining": 155,
      "usagePercentage": 22.5
    },
    "antiSpamRisk": {
      "score": 30,
      "level": "low",
      "reasons": []
    },
    "recentAuditLogs": [],
    "evaluatedAt": "2026-03-01T16:10:00.000Z"
  }
}
```

### `POST /api/v1/compliance/manual-assist`

Request:

```json
{
  "action": "copilot_reply",
  "context": "mode:reply"
}
```

Response `200`:

```json
{
  "usage": {
    "action": "copilot_reply",
    "limitPerMinute": 12,
    "usedInCurrentMinute": 3,
    "remainingInCurrentMinute": 9,
    "minuteBucket": "2026-03-01T16:10",
    "resetAt": "2026-03-01T16:11:00.000Z"
  }
}
```

Posibles errores adicionales:
- `429 RATE_LIMITED` cuando el usuario supera `MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE`.

### `GET /api/v1/compliance/messaging-mode`

Response `200`:

```json
{
  "mode": {
    "configuredMode": "crm_manual",
    "resolvedMode": "crm_manual",
    "provider": "dry_run",
    "dryRun": true,
    "cloudApiCredentials": {
      "accessTokenPresent": false,
      "phoneNumberIdPresent": false,
      "valid": false
    },
    "reason": "Modo CRM Manual: operacion asistida en WhatsApp Web, sin auto-envio.",
    "evaluatedAt": "2026-03-01T16:12:00.000Z"
  }
}
```

## Analytics

### `GET /api/v1/analytics/productivity`

Response `200`:

```json
{
  "productivity": {
    "generatedAt": "2026-03-01T16:12:00.000Z",
    "totals": {
      "leads": 120,
      "assignedLeads": 90,
      "unassignedLeads": 30,
      "overdueLeads": 14,
      "hotLeads": 28,
      "warmLeads": 62,
      "coldLeads": 30,
      "campaigns": 15,
      "campaignsSent": 10
    },
    "stageFunnel": [
      { "stage": "new", "count": 40, "percentage": 33.33 }
    ],
    "healthBreakdown": {
      "hot": 28,
      "warm": 62,
      "cold": 30
    },
    "conversion": {
      "wonRate": 10.5,
      "lostRate": 8.2,
      "qualifiedRate": 35.2,
      "firstResponseOnTimeRate": 72.1
    },
    "agents": []
  }
}
```

## Webhooks

### `GET /api/v1/webhooks/whatsapp`

Verificacion webhook Meta.

### `POST /api/v1/webhooks/whatsapp`

Recepcion de eventos.

### `GET /api/v1/webhooks/whatsapp/events`

Lista de eventos recientes (debug MVP).

Header requerido:

- `x-admin-sync-key: <ADMIN_SYNC_KEY>`

Posibles errores:

- `401 UNAUTHORIZED` si falta o no coincide `x-admin-sync-key`.
- `503 INTERNAL_ERROR` si el servidor no tiene `ADMIN_SYNC_KEY` configurado.

## Changelog del Contrato

- Fecha: 2026-02-27
- Cambio: contrato inicial del MVP CRM WhatsApp compliant
- Tipo: non-breaking
- Impacto: base de leads, campanas, templates, recordatorios y webhook

- Fecha: 2026-02-27
- Cambio: se agregan auth multiusuario y billing mensual; endpoints CRM quedan protegidos por suscripcion activa
- Tipo: non-breaking
- Impacto: habilita cobro mensual y control de acceso por workspace

- Fecha: 2026-02-27
- Cambio: migracion de persistencia a Firestore + despliegue en Vercel sin cambios de shape HTTP
- Tipo: non-breaking
- Impacto: contrato API se mantiene; mejora durabilidad y operacion serverless

- Fecha: 2026-02-27
- Cambio: nuevo endpoint `POST /api/v1/auth/google` para login/registro con Firebase Auth Google
- Tipo: non-breaking
- Impacto: se agrega acceso por Google sin afectar login tradicional por email/password

- Fecha: 2026-02-27
- Cambio: `POST /api/v1/campaigns/:campaignId/send` puede responder `429 RATE_LIMITED` por limite diario configurable
- Tipo: non-breaking
- Impacto: agrega guarda de cumplimiento para envios masivos diarios por workspace

- Fecha: 2026-02-27
- Cambio: se agregan `POST /api/v1/leads/upsert` y `PATCH /api/v1/leads/:leadId` para flujo CRM embebido en WhatsApp Web
- Tipo: non-breaking
- Impacto: permite crear/actualizar leads por telefono, enriqueciendo etapa/consentimiento/tags sin duplicar contactos

- Fecha: 2026-02-27
- Cambio: se agrega `POST /api/v1/admin/sync-subscription` para activacion/desactivacion server-to-server desde superadmin externo
- Tipo: non-breaking
- Impacto: sincroniza estado comercial del superadmin con el acceso real del CRM Extension por email

- Fecha: 2026-02-27
- Cambio: se agrega `POST /api/v1/admin/subscriptions-by-email` para consultar estado real de suscripcion por lote de correos
- Tipo: non-breaking
- Impacto: permite reconciliar estado de superadmin con estado real de extension sin modificar suscripciones

- Fecha: 2026-03-01
- Cambio: se agregan campos aditivos `opted_in`, `opted_in_at`, `opted_in_source` en `lead` para trazabilidad de consentimiento
- Tipo: non-breaking
- Impacto: preserva `consentStatus/consentSource` y habilita capa de cumplimiento detallada

- Fecha: 2026-03-01
- Cambio: se agregan `PATCH /api/v1/reminders/:reminderId/complete`, `POST /api/v1/campaigns/preflight`, `POST /api/v1/campaigns/:campaignId/preflight`, `GET /api/v1/compliance/trust-center` y `POST /api/v1/compliance/manual-assist`
- Tipo: non-breaking
- Impacto: agrega preflight de campanas, trust center de cumplimiento, rate limit por usuario/minuto para acciones asistidas y cierre trazable de recordatorios

- Fecha: 2026-03-01
- Cambio: se agregan `GET /api/v1/leads/inbox`, `PATCH /api/v1/leads/:leadId/assign`, `POST /api/v1/leads/:leadId/health-events`, `GET /api/v1/compliance/messaging-mode` y `GET /api/v1/analytics/productivity`; ademas se extiende `lead` con owner/health/SLA
- Tipo: non-breaking
- Impacto: habilita flujo multiagente, health score operativo, visibilidad de modo dual CRM vs Cloud API y dashboard de productividad sin romper endpoints existentes

- Fecha: 2026-03-01
- Cambio: hardening de seguridad en auth/webhooks (`429` por limite de intentos en `register/login/google` y proteccion de `GET /api/v1/webhooks/whatsapp/events` con `x-admin-sync-key`)
- Tipo: non-breaking
- Impacto: reduce riesgo de fuerza bruta y evita exposicion publica de eventos de webhook
