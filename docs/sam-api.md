# SAM API — Documentation

> **Source:** https://sam-api.pro/api-docs
> **Last fetched:** July 28, 2026
> **Description:** Professional API for Sham Cash (شام كاش) and Syriatel Cash (سيريتل كاش) wallet operations — verification, transfer, and management.

---

## Base URL

```
https://sam-api.pro/api
```

All API requests use this base URL.

---

## Authentication

Every request must include an API key in the header:

```
Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or alternatively:

```
X-Api-Key: sk_xxx...
```

API keys are created and managed from the SAM API dashboard.

---

## Endpoints

### Wallets

#### `GET /v1/wallets`

List all wallets linked to the account.

**Response:**
```json
[
  {
    "id": "f9a0738f-eb67-492a-b4ba-e3f08238fac7",
    "provider": "shamcash",
    "providerDisplayName": "ShamCash",
    "label": "محمد أحمد علي",
    "phone": "0991234567",
    "walletAddress": "e5289b724c3a3a47581b575bfdf6cd53",
    "accountNumber": "SC-00012345",
    "region": "دمشق",
    "status": "active"
  },
  {
    "id": "a3c12f88-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
    "provider": "syriatel",
    "providerDisplayName": "Syriatel Cash",
    "label": "محمد",
    "phone": "0931234567",
    "cashCode": "12345678",
    "status": "active"
  }
]
```

---

### ShamCash

#### `GET /v1/wallets/shamcash/{walletAddress}/balance`

Get wallet balance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| walletAddress | string | ✅ | Wallet UUID, 32-char hex address, or account number |

**Response:**
```json
[
  { "currency": "USD", "amount": 4.1, "label": null },
  { "currency": "SYP", "amount": 1606.5, "label": null },
  { "currency": "EUR", "amount": 0, "label": null }
]
```

**Example:**
```bash
curl https://sam-api.pro/api/v1/wallets/shamcash/e5289b724c3a3a47581b575bfdf6cd53/balance \
  -H "Authorization: Bearer sk_xxx"
```

---

#### `GET /v1/wallets/shamcash/{walletAddress}/transactions`

Get transaction history.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| walletAddress | string | ✅ | Wallet UUID, 32-char hex address, or account number |
| direction | string | ❌ | `in` (incoming), `out` (outgoing), `all` (default) |

**Response:**
```json
[
  {
    "id": "202235201",
    "type": "credit",
    "amount": 1600,
    "currency": "SYP",
    "counterparty": "حسين أحمد يوسف",
    "description": null,
    "status": null,
    "occurredAt": "2026-04-30T20:17:29"
  }
]
```

**Example:**
```bash
curl "https://sam-api.pro/api/v1/wallets/shamcash/e5289b724c3a3a47581b575bfdf6cd53/transactions?direction=in" \
  -H "Authorization: Bearer sk_xxx"
```

---

#### `POST /v1/wallets/shamcash/{walletAddress}/transfer`

Send money from one ShamCash wallet to another.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| walletAddress | string | ✅ | Wallet UUID, 32-char hex address, or account number |

**Request Body:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| recipientAddress | string | ✅ | Recipient wallet address (32 hex characters) |
| currencyId | number | ✅ | `1`=USD, `2`=SYP, `3`=EUR |
| amount | number | ✅ | Amount (positive) |
| note | string | ❌ | Optional note |

**Response:**
```json
{ "success": true, "message": "تم التحويل بنجاح" }
```

**Example:**
```bash
curl -X POST https://sam-api.pro/api/v1/wallets/shamcash/e5289b724c3a3a47581b575bfdf6cd53/transfer \
  -H "Authorization: Bearer sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "cf3a8cd33b27ba7a31793b069d919a44",
    "currencyId": 2,
    "amount": 500
  }'
```

---

### Syriatel Cash

#### `GET /v1/wallets/syriatel/{phoneOrCode}/balance`

Get Syriatel Cash wallet balance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| phoneOrCode | string | ✅ | Wallet UUID, 10-digit phone number, or 8-digit cash code |

**Response:**
```json
[
  { "currency": "SYP", "amount": 25000, "label": null }
]
```

**Example:**
```bash
curl https://sam-api.pro/api/v1/wallets/syriatel/0991234567/balance \
  -H "Authorization: Bearer sk_xxx"
```

---

#### `GET /v1/wallets/syriatel/{phoneOrCode}/transactions`

Get Syriatel Cash transaction history.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| phoneOrCode | string | ✅ | Wallet UUID, 10-digit phone number, or 8-digit cash code |
| direction | string | ❌ | `in`, `out`, `all` (default) |

**Response:**
```json
[
  {
    "id": "TXN_12345",
    "type": "debit",
    "amount": 1000,
    "currency": "SYP",
    "counterparty": "0991234567",
    "description": null,
    "status": "completed",
    "occurredAt": "2026-04-30T18:00:00"
  }
]
```

**Example:**
```bash
curl "https://sam-api.pro/api/v1/wallets/syriatel/0991234567/transactions?direction=out" \
  -H "Authorization: Bearer sk_xxx"
```

---

#### `POST /v1/wallets/syriatel/{phoneOrCode}/transfer`

Send money from Syriatel Cash.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| phoneOrCode | string | ✅ | Wallet UUID, 10-digit phone number, or 8-digit cash code |

**Request Body:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| toGsmOrCode | string | ✅ | Recipient phone number or cash code |
| amount | number | ✅ | Amount (positive) |
| pinCode | string | ✅ | 4-digit PIN code |

**Response:**
```json
{ "success": true, "message": "تمت العملية بنجاح" }
```

**Example:**
```bash
curl -X POST https://sam-api.pro/api/v1/wallets/syriatel/0991234567/transfer \
  -H "Authorization: Bearer sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "toGsmOrCode": "0989876543",
    "amount": 1000,
    "pinCode": "1234"
  }'
```

---

### Invoices (Payment Gateway)

#### `POST /v1/invoices`

Create a payment invoice. The invoice is valid for 15 minutes. Returns a payment URL that the customer opens to complete payment. Requires an active subscription and a wallet linked to your account.

**Request Body:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| method | string | ✅ | `"shamcash"` or `"syriatel"` |
| identifier | string | ✅ | Receiving wallet identifier — UUID, 32-char hex, account number (ShamCash), phone (10 digits), or cash code (8 digits, Syriatel) |
| amount | string | ✅ | Amount to charge |
| currency | string | ✅ | `"USD"`, `"SYP"`, or `"EUR"` |
| webhookUrl | string | ✅ | POST URL that receives `invoice.paid` or `invoice.expired` notifications |

**Response:**
```json
{
  "invoiceId": "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
  "paymentUrl": "https://sam-api.pro/pay/3f8a1c2d-...",
  "expiresAt": "2026-05-01T14:15:00.000Z"
}
```

**Example:**
```bash
curl -X POST https://sam-api.pro/api/v1/invoices \
  -H "Authorization: Bearer sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "syriatel",
    "identifier": "0991234567",
    "amount": "5000",
    "currency": "SYP",
    "webhookUrl": "https://yoursite.com/webhook/payment"
  }'
```

---

#### `GET /pay/{invoiceId}`

Get invoice details. **Does NOT require authentication** — designed for the payment page that the customer opens. If the invoice has expired while fetching, the status is auto-updated and a webhook is sent.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| invoiceId | string | ✅ | Invoice UUID returned from `POST /v1/invoices` |

**Response:**
```json
{
  "id": "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
  "method": "syriatel",
  "status": "pending",
  "amount": "5000",
  "currency": "SYP",
  "expiresAt": "2026-05-01T14:15:00.000Z"
}
```

---

## Webhook

When a payment is completed or expired, SAM API sends a POST request to the `webhookUrl` specified when creating the invoice.

**Payload:**
```json
{
  "event": "invoice.paid" | "invoice.expired",
  "invoiceId": "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
  "method": "shamcash" | "syriatel",
  "amount": "5000",
  "currency": "SYP"
}
```

---

## Integration Notes

- The SAM API supports two wallet providers: **ShamCash** (شام كاش) and **Syriatel Cash** (سيريتل كاش)
- Invoice payment flow: create invoice → redirect customer to `paymentUrl` → customer pays → webhook confirms
- Wallet-to-wallet transfers (ShamCash only): direct transfer between wallet addresses
- Syriatel Cash transfers require a 4-digit **PIN code**
- All monetary amounts should be sent as strings to preserve precision
