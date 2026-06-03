# Security notes (Veluno / Kortexa backend)

## Secrets

- Keep `application.yaml` out of git (already in `.gitignore`).
- Use `application.yaml.example` and environment variables for production.
- Rotate credentials if they were ever committed or shared.

## Production checklist

- Set `app.security.expose-openapi=false` (Swagger admin-only by default).
- Set `spring.jpa.hibernate.ddl-auto=validate` (Flyway owns schema).
- Set `spring.jpa.show-sql=false`.
- Use a strong Base64 JWT secret (32+ bytes).
- Configure `app.security.cors-allowed-origins` to your real frontend URL(s).
- Run Postgres/Redis/Kafka with auth and private networking.

## Rate limiting

Auth endpoints use an in-memory per-IP limiter. For horizontal scale, replace with Redis-backed limits.
