.PHONY: help up down up-infra down-infra build logs ps clean

COMPOSE = docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Infra (DB, Redis, MailHog, MinIO) ──

up-infra: ## Start infra only (postgres, redis, mailhog, minio)
	$(COMPOSE) up -d postgres redis mailhog minio

down-infra: ## Stop infra
	$(COMPOSE) down --remove-orphans

# ── App (Backend + Frontend + AI + Infra) ──

up: ## Start all services
	$(COMPOSE) --profile app up -d

down: ## Stop all services
	$(COMPOSE) --profile app down --remove-orphans

# ── Build ──

build: ## Build all images
	$(COMPOSE) --profile app build

build-backend: ## Build backend image
	$(COMPOSE) build backend

build-frontend: ## Build frontend image
	$(COMPOSE) build frontend

build-ai: ## Build AI service image
	$(COMPOSE) build ai-service

# ── Logs ──

logs: ## Tail logs for all running services
	$(COMPOSE) logs -f --tail=100

logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f --tail=100 backend

logs-ai: ## Tail AI service logs
	$(COMPOSE) logs -f --tail=100 ai-service

# ── Utils ──

ps: ## Show running containers
	$(COMPOSE) ps

clean: ## Stop all and remove volumes
	$(COMPOSE) --profile app down -v --remove-orphans
