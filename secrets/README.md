# Docker Secrets

This directory stores secret files for Docker Swarm / production deployments.

## Quick Setup

Run the initialization script to generate all required secrets:

```bash
./scripts/init-secrets.sh
```

This creates both `.env` (for docker-compose standalone) and `secrets/*.txt` files (for Docker Swarm).

## Manual Setup

Create each secret file with a single value (no trailing newline):

```bash
openssl rand -base64 48 | tr -d '\n' > secrets/jwt_secret.txt
openssl rand -base64 24 | tr -d '\n' > secrets/db_password.txt
openssl rand -base64 24 | tr -d '\n' > secrets/redis_password.txt
openssl rand -base64 24 | tr -d '\n' > secrets/minio_root_password.txt
openssl rand -hex 32 | tr -d '\n' > secrets/ai_service_api_key.txt
openssl rand -hex 32 | tr -d '\n' > secrets/encryption_key.txt
```

## Secret Files

| File | Used By | Description |
|------|---------|-------------|
| `jwt_secret.txt` | Backend | JWT token signing key |
| `db_password.txt` | PostgreSQL, Backend, AI Service | Database password |
| `redis_password.txt` | Redis, Backend | Redis authentication |
| `minio_root_password.txt` | MinIO, Backend | Object storage password |
| `ai_service_api_key.txt` | AI Service, Backend | Inter-service API key |
| `encryption_key.txt` | Backend | PII data encryption key |

## Security Notes

- All `*.txt` files in this directory are gitignored
- Never commit secret values to version control
- Rotate secrets periodically using `./scripts/init-secrets.sh --force`
- In production, use a proper secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.)
