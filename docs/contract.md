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

### `POST /api/v1/auth/login`

Request:

```json
{
  "email": "ken@demo.com",
  "password": "secret123"
}
```

Response `200`: mismo shape que register.

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

### `GET /api/v1/leads`

Response `200`:

```json
{
  "leads": []
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

### `POST /api/v1/campaigns/:campaignId/send`

Response `200`:

```json
{
  "campaign": {},
  "results": []
}
```

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

## Webhooks

### `GET /api/v1/webhooks/whatsapp`

Verificacion webhook Meta.

### `POST /api/v1/webhooks/whatsapp`

Recepcion de eventos.

### `GET /api/v1/webhooks/whatsapp/events`

Lista de eventos recientes (debug MVP).

## Changelog del Contrato

- Fecha: 2026-02-27
- Cambio: contrato inicial del MVP CRM WhatsApp compliant
- Tipo: non-breaking
- Impacto: base de leads, campanas, templates, recordatorios y webhook

- Fecha: 2026-02-27
- Cambio: se agregan auth multiusuario y billing mensual; endpoints CRM quedan protegidos por suscripcion activa
- Tipo: non-breaking
- Impacto: habilita cobro mensual y control de acceso por workspace

