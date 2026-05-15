---
# PROJECT: tighten this glob to your HTTP handler / route directories.
# Examples:
#   applyTo: "src/api/**/*.ts"
#   applyTo: "**/handlers/**/*.go"
#   applyTo: "app/views/**/*.py"
applyTo: "**/api/**/*, **/handlers/**/*, **/routes/**/*"
---

# HTTP API conventions

REST/JSON baseline. Adapt to your project's framework but keep the shape.

## URLs

- Resource-oriented: nouns, not verbs. `/policies/{id}`, not `/getPolicy`.
- Plural collection names: `/policies`, `/applications`, `/users`.
- Sub-resources nest under the parent: `/applications/{id}/events`.
- IDs in the path are opaque strings (UUIDs or stable identifiers). No raw integer database IDs in URLs.
- Lowercase, hyphen-separated path segments: `/billing-accounts/{id}`, not `/billingAccounts/{id}`.

## Methods

- `GET` for reads (idempotent, no side effects).
- `POST` for creating resources or invoking operations that don't fit a resource shape.
- `PUT` for full replacement of a resource (rare — most updates fit a domain operation better).
- `PATCH` for partial updates.
- `DELETE` only when a resource is genuinely deletable.

## Status codes

- `200 OK` — successful read or non-creating operation.
- `201 Created` — resource created. Include a `Location` header.
- `204 No Content` — successful operation with no body to return.
- `400 Bad Request` — malformed request, invalid body shape.
- `401 Unauthorized` — missing or invalid credentials.
- `403 Forbidden` — authenticated but not allowed.
- `404 Not Found` — resource doesn't exist.
- `409 Conflict` — state conflict.
- `422 Unprocessable Entity` — request shape is valid but semantically rejected.
- `500 Internal Server Error` — unexpected failure.
- `502 Bad Gateway` — upstream service failed.
- `504 Gateway Timeout` — upstream timed out.

## Error envelope

Every non-2xx response uses the same JSON shape:

```json
{
  "error": {
    "code": "resource.not_found",
    "message": "Resource abc-123 does not exist",
    "detail": { "resourceId": "abc-123" }
  }
}
```

`code` is a stable identifier. `message` is human-safe. `detail` is structured context (optional). Never include stack traces, internal paths, or wrapped error chains in the response body.

## Request bodies

- JSON. `Content-Type: application/json` required for any request with a body.
- Reject unknown fields explicitly so typos in client requests fail loudly.
- Validate at the handler layer before calling the business layer.

## Response bodies

- Always JSON.
- Wrap collections: `{"items": [...], "total": 42}`, not a bare array. Lets you add pagination metadata without breaking clients.
- Return the created or updated resource on `POST` / `PUT` / `PATCH`. Don't make the client follow up with a `GET`.

## Health probes

Every service exposes:

- `GET /health/live` — instant `200 OK` if the process is up. No dependency checks.
- `GET /health/ready` — `200 OK` only if dependencies respond. Returns `503` otherwise with which dep failed in the body.

## Headers

- `X-Request-Id` — set by middleware on every request. If the client provides one, propagate it; otherwise generate a UUID.
- Outbound calls to other services include `X-Request-Id` for tracing.

## What not to do

- Don't put verbs in URLs.
- Don't return `200 OK` with `{"error": ...}` in the body. Use the right status code.
- Don't leak internal error chains, file paths, or stack traces in responses.
- Don't accept query-string filters unless they're documented and handled in the business layer.
- Don't use `PUT` for partial updates.
- Don't return bare arrays from list endpoints.
