# N8N Workflows — FAC Reactivation Engine

## Overview

Four N8N workflows orchestrate external integrations. All workflows authenticate using a Bearer token (`N8N_WEBHOOK_SECRET`).

**Base URL**: `http://app:3000` (Docker internal) or `http://localhost:3000` (local dev)

---

## 1. waha-message-received

**Purpose**: Routes incoming WhatsApp messages from WAHA to the conversation handler.

**Trigger**: Webhook Node — receives POST from WAHA when a message arrives.

**Flow**:
1. **Webhook** receives WAHA payload
2. **IF** `payload.fromMe === false` AND `payload.from` does not end with `@g.us` (skip groups)
3. **HTTP Request**: POST `{{BASE_URL}}/api/n8n/conversation`
   - Headers: `Authorization: Bearer {{N8N_WEBHOOK_SECRET}}`
   - Body:
     ```json
     {
       "phone": "+{{payload.from.replace('@c.us', '')}}",
       "text": "{{payload.body}}",
       "channel": "whatsapp",
       "externalId": "{{payload.id}}"
     }
     ```
4. **On Error**: Send WhatsApp to Antonio via WAHA node

### N8N JSON Export

```json
{
  "name": "waha-message-received",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "waha-message",
        "responseMode": "onReceived"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            { "value1": "={{$json.payload.fromMe}}", "value2": false }
          ],
          "string": [
            { "value1": "={{$json.payload.from}}", "operation": "notContains", "value2": "@g.us" }
          ]
        }
      },
      "name": "Filter",
      "type": "n8n-nodes-base.if",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.APP_BASE_URL}}/api/n8n/conversation",
        "method": "POST",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "phone", "value": "=+{{$json.payload.from.replace('@c.us', '')}}" },
            { "name": "text", "value": "={{$json.payload.body}}" },
            { "name": "channel", "value": "whatsapp" },
            { "name": "externalId", "value": "={{$json.payload.id}}" }
          ]
        }
      },
      "name": "Call Conversation API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 250]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Filter", "type": "main", "index": 0 }]] },
    "Filter": { "main": [[{ "node": "Call Conversation API", "type": "main", "index": 0 }]] }
  }
}
```

### WAHA Configuration

In WAHA dashboard, set the webhook URL to:
```
http://<n8n-host>:5678/webhook/waha-message
```

---

## 2. handoff-notifier

**Purpose**: Sends WhatsApp notification to sales rep when a lead is handed off.

**Trigger**: Webhook Node — called from the app's handoff service.

**Flow**:
1. **Webhook** receives handoff data
2. **HTTP Request**: POST `{{BASE_URL}}/api/n8n/handoff`
   - Headers: `Authorization: Bearer {{N8N_WEBHOOK_SECRET}}`
   - Body: `{ leadName, leadPhone, reason, segment, score }`
3. **On Error**: Log to N8N execution history

### N8N JSON Export

```json
{
  "name": "handoff-notifier",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "handoff-notify",
        "responseMode": "onReceived"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{$env.APP_BASE_URL}}/api/n8n/handoff",
        "method": "POST",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "leadName", "value": "={{$json.leadName}}" },
            { "name": "leadPhone", "value": "={{$json.leadPhone}}" },
            { "name": "reason", "value": "={{$json.reason}}" },
            { "name": "segment", "value": "={{$json.segment}}" },
            { "name": "score", "value": "={{$json.score}}" }
          ]
        }
      },
      "name": "Notify Sales Rep",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Notify Sales Rep", "type": "main", "index": 0 }]] }
  }
}
```

---

## 3. health-monitor

**Purpose**: Monitors app health every 5 minutes. Alerts via WhatsApp if the app is down.

**Trigger**: Schedule Node — every 5 minutes.

**Flow**:
1. **Schedule** trigger (every 5 min)
2. **HTTP Request**: GET `{{BASE_URL}}/api/health`
   - Continue on fail: `true`
3. **IF** response status !== 200 OR `status !== "ok"`
4. **WAHA HTTP Request**: Send WhatsApp to Antonio
   - POST `{{WAHA_URL}}/api/sendText`
   - Body: `{ session: "default", chatId: "{{ANTONIO_PHONE}}@c.us", text: "ALERT: FAC Engine is DOWN. Status: {{status}}" }`

### N8N JSON Export

```json
{
  "name": "health-monitor",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 5 }] }
      },
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{$env.APP_BASE_URL}}/api/health",
        "options": { "timeout": 10000 },
        "continueOnFail": true
      },
      "name": "Health Check",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            { "value1": "={{$json.status}}", "operation": "notEqual", "value2": "ok" }
          ]
        }
      },
      "name": "Is Down?",
      "type": "n8n-nodes-base.if",
      "position": [650, 300]
    },
    {
      "parameters": {
        "url": "={{$env.WAHA_API_URL}}/api/sendText",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "X-Api-Key", "value": "={{$env.WAHA_API_KEY}}" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "session", "value": "default" },
            { "name": "chatId", "value": "={{$env.ANTONIO_PHONE}}@c.us" },
            { "name": "text", "value": "ALERT: FAC Reactivation Engine is DOWN.\nServices: {{JSON.stringify($json.services)}}" }
          ]
        }
      },
      "name": "Alert WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 250]
    }
  ],
  "connections": {
    "Schedule": { "main": [[{ "node": "Health Check", "type": "main", "index": 0 }]] },
    "Health Check": { "main": [[{ "node": "Is Down?", "type": "main", "index": 0 }]] },
    "Is Down?": { "main": [[{ "node": "Alert WhatsApp", "type": "main", "index": 0 }]] }
  }
}
```

---

## 4. daily-report

**Purpose**: Sends a daily activity summary to Antonio via WhatsApp at 8h ET.

**Trigger**: Schedule Node — daily at 8:00 AM (America/New_York).

**Flow**:
1. **Schedule** trigger (daily 8:00 AM ET)
2. **HTTP Request**: GET `{{BASE_URL}}/api/analytics/daily-summary`
   - Headers: `Authorization: Bearer {{N8N_WEBHOOK_SECRET}}`
3. **WAHA HTTP Request**: Send WhatsApp to Antonio
   - Body text: `{{$json.textSummary}}`

### N8N JSON Export

```json
{
  "name": "daily-report",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{
            "field": "cronExpression",
            "expression": "0 8 * * *"
          }]
        }
      },
      "name": "Schedule 8AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{$env.APP_BASE_URL}}/api/analytics/daily-summary",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      },
      "name": "Get Summary",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.WAHA_API_URL}}/api/sendText",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "X-Api-Key", "value": "={{$env.WAHA_API_KEY}}" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "session", "value": "default" },
            { "name": "chatId", "value": "={{$env.ANTONIO_PHONE}}@c.us" },
            { "name": "text", "value": "={{$json.textSummary}}" }
          ]
        }
      },
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Schedule 8AM": { "main": [[{ "node": "Get Summary", "type": "main", "index": 0 }]] },
    "Get Summary": { "main": [[{ "node": "Send WhatsApp", "type": "main", "index": 0 }]] }
  }
}
```

---

## Environment Variables in N8N

Set these in N8N Settings > Variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_BASE_URL` | `http://app:3000` | App URL (Docker internal) |
| `N8N_WEBHOOK_SECRET` | `your-secret` | Bearer token for API auth |
| `WAHA_API_URL` | `http://waha:3001` | WAHA API URL |
| `WAHA_API_KEY` | `your-key` | WAHA API key |
| `ANTONIO_PHONE` | `14075551234` | Antonio's phone (no + prefix) |

## HTTP Header Auth Credential

Create a credential of type "Header Auth" in N8N:
- **Name**: `FAC API Auth`
- **Name**: `Authorization`
- **Value**: `Bearer {{N8N_WEBHOOK_SECRET}}`

Use this credential in all HTTP Request nodes that call the app API.
