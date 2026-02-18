.PHONY: help up down up-infra down-infra up-gpu build build-backend build-frontend build-ai logs logs-backend logs-ai ps clean seed seed-voc seed-reset seed-status seed-vocs setup ollama-check

COMPOSE = docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Infra (DB, Redis, MailHog, MinIO) ──

up-infra: ## Start infra only (postgres, redis, mailhog, minio)
	$(COMPOSE) up -d postgres redis mailhog minio

down-infra: ## Stop infra
	$(COMPOSE) down --remove-orphans

# ── App (Backend + Frontend + AI + Infra) ──
# 네이티브 Ollama가 실행 중이어야 함 (Mac: brew install ollama && ollama serve)

up: ollama-check ## Start all services (requires native Ollama)
	$(COMPOSE) --profile app up -d

down: ## Stop all services
	$(COMPOSE) --profile app down --remove-orphans

# ── GPU Server (Docker Ollama + App) ──

up-gpu: ## Start all with Docker Ollama (GPU server only)
	$(COMPOSE) --profile app --profile gpu up -d

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

# ── Seed (Vector DB → pgvector) ──

seed-reset: ## Reset vector store and re-seed from scratch
	@echo "Resetting vector store and re-seeding..."
	@curl -s -X POST http://localhost:8001/api/v1/seed/reset | python3 -m json.tool

seed: ## Add expanded seed data to vector store (pgvector)
	@curl -s -X POST http://localhost:8001/api/v1/seed \
		-H 'Content-Type: application/json' \
		-d '{"source": "expanded"}' | python3 -m json.tool

seed-voc: ## Seed Korean VOC examples to vector store
	@curl -s -X POST http://localhost:8001/api/v1/seed \
		-H 'Content-Type: application/json' \
		-d '{"source": "vocs"}' | python3 -m json.tool

seed-status: ## Check vector store seeding status
	@curl -s http://localhost:8001/api/v1/seed/status | python3 -m json.tool

seed-vocs: ## Index existing VOCs from DB into pgvector
	@echo "Indexing existing VOCs..."
	@docker exec voc-postgres psql -U $${POSTGRES_USER:-voc_user} -d $${POSTGRES_DB:-vocautobot} -t -c \
		"SELECT json_agg(json_build_object('id',id,'title',title,'content',content)) FROM vocs" \
		| python3 -c "\
	import sys,json,subprocess; \
	data=json.loads(sys.stdin.read().strip()); \
	[print(f'VOC {v[\"id\"]}: '+json.loads(subprocess.run(['curl','-s','-X','POST','http://localhost:8001/api/v1/voc/index','-H','Content-Type: application/json','-d',json.dumps({'voc_id':v['id'],'title':v['title'],'content':v['content']})],capture_output=True,text=True).stdout).get('status','error')) for v in data]"

setup: up ## Full setup: start services + seed pgvector + index VOCs
	@echo "Waiting for services to start..."
	@sleep 10
	@$(MAKE) seed-reset
	@$(MAKE) seed-voc
	@$(MAKE) seed-vocs
	@echo "Setup complete!"

# ── Utils ──

ps: ## Show running containers
	$(COMPOSE) ps

clean: ## Stop all and remove volumes
	$(COMPOSE) --profile app --profile gpu down -v --remove-orphans

ollama-check: ## Verify native Ollama is running
	@curl -sf http://localhost:11434/api/tags > /dev/null 2>&1 || \
		(echo "❌ Ollama가 실행되고 있지 않습니다." && \
		 echo "   Mac: brew install ollama && ollama serve" && \
		 echo "   GPU 서버: make up-gpu 사용" && exit 1)
	@echo "✅ Ollama 연결 확인 (localhost:11434)"
