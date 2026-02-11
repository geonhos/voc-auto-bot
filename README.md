# VOC Auto Bot

고객의 소리(VOC)를 자동으로 분석하고 처리하는 지능형 서비스

## 프로젝트 배경

### 현재 VOC 처리 프로세스의 문제점

기존 VOC 처리는 다음과 같은 다단계 프로세스를 거칩니다:

```
고객 -> VOC 처리 담당자 -> 현업 관리자 -> 개발자
```

이 과정에서 두 가지 핵심 문제가 발생합니다:

#### 1. 비효율적인 VOC 처리 과정

- VOC 1차 담당자가 고객 문의에 즉시 응대하기 어려움
- 단순 문의도 여러 단계를 거쳐야 해결 가능
- 담당자 간 정보 전달 과정에서 시간 지연 및 정보 누락 발생
- 고객 대기 시간 증가로 인한 만족도 저하

#### 2. VOC 분석에 과도한 시간 소요

- **유사/동일 이력 파악의 어려움**: 과거에 동일하거나 유사한 문제가 있었는지 확인하는 데 많은 시간이 소요됨
- **로그 분석의 비효율**: 문제 원인 파악을 위한 로그 분석에 상당한 시간이 필요

### 해결하고자 하는 목표

> **"VOC 1차 담당자가 입력만으로 즉시 고객 응대가 가능한 환경 구축"**

- AI 기반 VOC 자동 분류 및 분석
- 과거 유사 사례 즉시 검색 및 제안
- 로그 자동 분석을 통한 원인 파악 시간 단축
- 표준 응대 가이드 자동 생성

## 기대 효과

- VOC 처리 시간 단축
- 1차 담당자의 즉시 응대율 향상
- 일관된 고객 응대 품질 확보
- 개발팀으로 넘어가는 불필요한 문의 감소

## 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
│              React + TypeScript + Next.js                         │
│              (대시보드 UI, Zustand 상태관리)                        │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Backend (Monolith)                            │
│                    Java Spring Boot                               │
│                                                                   │
│  • VOC CRUD API          • 사용자 인증/인가 (Spring Security)      │
│  • 비즈니스 로직          • AI/RAG 기능 통합                        │
└─────────────────────────┬────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────────────┐
│      Ollama Server       │   │          Database                   │
│   (Local LLM Server)     │   │     PostgreSQL + pgvector           │
│                          │   │                                     │
│  • /api/embed 임베딩     │   │  • VOC 데이터 저장                   │
│  • /api/generate LLM    │   │  • 벡터 임베딩 저장 (768차원)         │
│  • nomic-embed-text      │   │  • 코사인 유사도 검색                │
└─────────────────────────┘   └─────────────────────────────────────┘
```

### RAG (Retrieval-Augmented Generation) 구현

유사 VOC 검색을 위한 RAG 파이프라인이 Java 백엔드에 통합되어 있습니다:

| 구성요소 | 파일 | 설명 |
|----------|------|------|
| 임베딩 생성 | `EmbeddingService.java` | Ollama API (`/api/embed`)를 통한 텍스트 임베딩 생성 |
| 벡터 검색 | `VectorSearchAdapter.java` | pgvector 코사인 유사도 검색 (`<=>` 연산자) |
| 벡터 저장소 | `VectorEmbeddingRepository.java` | 벡터 임베딩 CRUD 및 유사도 쿼리 |
| 프론트엔드 | `useSimilarVocs.ts` | 유사 VOC 조회 React Hook |

## 기술 스택

### Backend
| 구분 | 기술 | 설명 |
|------|------|------|
| API Server | Java 21 / Spring Boot 3.x | 메인 API 서버, 인증, 비즈니스 로직, AI 기능 통합 |
| Security | Spring Security + JWT (httpOnly Cookie) | httpOnly/Secure/SameSite=Strict 쿠키 기반 인증 |
| Realtime | SseEmitter (SSE) | Server-Sent Events 실시간 알림 |
| LLM | Ollama (nomic-embed-text) | 로컬 LLM 서버, 임베딩 + 감성 분석 + 카테고리 추천 |
| Vector Search | pgvector | 코사인 유사도 기반 유사 VOC 검색 |
| Testing | JUnit 5 + MockMvc | 컨트롤러 통합 + 도메인/서비스 단위 테스트 (200+) |

### AI Service
| 구분 | 기술 | 설명 |
|------|------|------|
| Framework | Python 3.11 / FastAPI | 로그 분석 전용 서비스 |
| Embedding | OpenAI / LangChain | 텍스트 임베딩 생성 |
| Vector Store | PostgreSQL + pgvector | 로그 임베딩 저장 및 유사도 검색 |

### Frontend
| 구분 | 기술 | 설명 |
|------|------|------|
| Framework | React 18 + Next.js | SSR 지원 대시보드 |
| Language | TypeScript | 타입 안정성 확보 |
| 상태관리 | Zustand | 경량 상태관리 라이브러리 |
| 스타일링 | Tailwind CSS | 유틸리티 기반 CSS |
| 테스트 | Vitest + Playwright | 단위 테스트 (ViewModel) 및 E2E 테스트 |

### Database
| 구분 | 기술 | 설명 |
|------|------|------|
| RDBMS | PostgreSQL 15+ | 메인 데이터 저장소 |
| Vector DB | pgvector | 768차원 벡터 임베딩 저장 및 유사도 검색 |

### Infrastructure
| 구분 | 기술 | 설명 |
|------|------|------|
| Container | Docker / Docker Compose | 로컬 개발 환경 구성 |
| CI/CD | GitHub Actions | Backend/Frontend/AI Service 자동 빌드/테스트/배포 |
| Monitoring | Docker Compose healthcheck | 서비스 상태 모니터링 |

## 프로젝트 구조

```
voc-auto-bot/
├── backend/                          # Spring Boot 백엔드 (멀티모듈)
│   ├── voc-bootstrap/                # 애플리케이션 진입점
│   ├── voc-domain/                   # 도메인 모델
│   ├── voc-application/              # 비즈니스 로직
│   └── voc-adapter/                  # 외부 연동 어댑터
│       └── src/main/java/.../adapter/out/
│           ├── ai/                   # AI/LLM 연동 (EmbeddingService)
│           └── persistence/vector/   # 벡터 검색 (VectorSearchAdapter)
├── frontend/                         # Next.js 프론트엔드
│   ├── src/
│   │   ├── hooks/                    # React Hooks (useSimilarVocs 등)
│   │   └── ...
│   └── e2e/                          # Playwright E2E 테스트
├── ai-service/                      # FastAPI AI 분석 서비스
│   ├── app/
│   │   ├── embedding_service.py     # 로그 임베딩 (pgvector)
│   │   └── ...
│   └── requirements.txt
├── figma-plugin/                    # Figma 디자인 생성 플러그인
│   ├── src/                         # TypeScript 소스
│   └── dist/                        # 빌드 산출물
├── infra/                           # 인프라 설정
├── docs/                            # 프로젝트 문서
│   ├── screens/                     # 화면별 기능 명세 (SC-01~11)
│   ├── api/openapi.yaml             # OpenAPI 스펙
│   ├── REQUIREMENTS.md              # 요구사항 정의서
│   └── testing/                     # 테스트 문서
└── docker-compose.yml               # Docker 개발 환경
```

## AI Service (FastAPI)

VOC 로그 분석 및 감성 분석을 위한 독립 서비스. Backend에서 HTTP로 호출.

| 기능 | 설명 |
|------|------|
| 로그 임베딩 | OpenAI Embedding → pgvector 저장 |
| 로그 분석 | LLM 기반 로그 원인 분석 |
| 유사 로그 검색 | pgvector 코사인 유사도 검색 |
| 감성 분석 | Ollama LLM 프롬프트 기반 sentiment 분류 (positive/negative/neutral) |

## Figma Plugin — Design Generator

프론트엔드 디자인 토큰(`tailwind.config.ts`, `globals.css`)을 기반으로 Figma에서 디자인 에셋을 자동 생성하는 플러그인.

### 생성 가능 항목
- **Design System**: Color Palette (PaintStyles), Typography Scale (TextStyles), Component Library
- **화면 와이어프레임** (10개): Login, Dashboard, VOC Input/List/Kanban/Detail, Email Compose, Admin Users/Categories, Public Status
- **레이아웃 모드**: Row (수평 나열) / Flow Diagram (유저 플로우 + 화살표)
- **기능 메모**: 화면별 AI/기능/UX/API/기술 주석 패널

### 빌드 & 사용
```bash
cd figma-plugin
npm install
npm run build          # dist/code.js 생성
# Figma > Plugins > Development > Import plugin from manifest
```

## 시작하기

### 개발 환경
```bash
# 인프라 (PostgreSQL, Redis, OpenSearch, Ollama)
docker compose up -d

# Backend
cd backend && ./gradlew bootRun

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn app.main:app --reload
```

## 라이선스

MIT License
