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
| API Server | Java 17+ / Spring Boot 3.x | 메인 API 서버, 인증, 비즈니스 로직, AI 기능 통합 |
| Security | Spring Security + JWT | 인증/인가 처리 |
| LLM | Ollama (nomic-embed-text) | 로컬 LLM 서버, 임베딩 생성 |
| Vector Search | pgvector | 코사인 유사도 기반 유사 VOC 검색 |

### Frontend
| 구분 | 기술 | 설명 |
|------|------|------|
| Framework | React 18 + Next.js | SSR 지원 대시보드 |
| Language | TypeScript | 타입 안정성 확보 |
| 상태관리 | Zustand | 경량 상태관리 라이브러리 |
| 스타일링 | Tailwind CSS | 유틸리티 기반 CSS |
| 테스트 | Jest + Playwright | 단위 테스트 및 E2E 테스트 |

### Database
| 구분 | 기술 | 설명 |
|------|------|------|
| RDBMS | PostgreSQL 15+ | 메인 데이터 저장소 |
| Vector DB | pgvector | 768차원 벡터 임베딩 저장 및 유사도 검색 |

### Infrastructure
| 구분 | 기술 | 설명 |
|------|------|------|
| Container | Docker / Docker Compose | 로컬 개발 환경 구성 |
| CI/CD | GitHub Actions | 자동 빌드/테스트/배포 |

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
├── infra/                            # 인프라 설정
├── docs/                             # 프로젝트 문서
└── docker-compose.yml                # Docker 개발 환경
```

## 시작하기

(추후 업데이트 예정)

## 라이선스

MIT License
