# DTO Package Structure - VOC Auto Bot

## Overview

This document defines the package structure for DTOs, Commands, Queries, and Domain Models to ensure proper separation of concerns in Hexagonal Architecture.

## Package Structure

### 1. Domain Layer (`voc-domain`)

```
com.geonho.vocautobot.domain
├── common/
│   └── Auditable.java              # Interface for audit fields (createdAt, updatedAt)
├── voc/
│   ├── VocDomain.java              # Pure domain model (NO JPA annotations)
│   ├── VocAttachmentDomain.java    # Pure domain model for attachments
│   ├── VocMemoDomain.java          # Pure domain model for memos
│   ├── VocStatus.java              # Enum
│   ├── VocPriority.java            # Enum
│   └── VocAnalysis.java            # Domain model for analysis
├── user/
│   └── User.java                   # Pure domain model
├── category/
│   └── Category.java               # Pure domain model
└── email/
    ├── EmailLog.java               # Pure domain model
    └── EmailTemplate.java          # Pure domain model
```

**Rules:**
- NO `jakarta.persistence` imports
- NO `@Entity`, `@Table`, `@Column` annotations
- Only pure Java + Lombok annotations
- Contains business logic and validation rules

### 2. Application Layer (`voc-application`)

```
com.geonho.vocautobot.application
├── voc/
│   ├── port/
│   │   ├── in/
│   │   │   ├── CreateVocUseCase.java
│   │   │   ├── GetVocDetailUseCase.java
│   │   │   └── dto/
│   │   │       ├── CreateVocCommand.java     # Input command
│   │   │       ├── VocResult.java            # Output result
│   │   │       └── VocListQuery.java         # Query parameters
│   │   └── out/
│   │       ├── LoadVocPort.java
│   │       └── SaveVocPort.java
│   └── usecase/
│       └── CreateVocService.java
├── auth/
│   ├── port/
│   │   ├── in/
│   │   │   └── dto/
│   │   │       ├── LoginCommand.java
│   │   │       └── LoginResult.java
│   │   └── out/
│   └── usecase/
└── common/
    └── exception/
```

**Rules:**
- Commands/Queries are input DTOs for use cases
- Results are output DTOs from use cases
- NO dependency on adapter layer
- May reference domain models

### 3. Adapter Layer (`voc-adapter`)

#### 3.1 Input Adapters (Controllers)

```
com.geonho.vocautobot.adapter.in.web
├── voc/
│   ├── VocController.java
│   └── dto/
│       ├── CreateVocRequest.java     # HTTP request DTO
│       ├── UpdateVocRequest.java     # HTTP request DTO
│       └── VocResponse.java          # HTTP response DTO
├── auth/
│   ├── AuthController.java
│   └── dto/
│       ├── LoginRequest.java
│       └── TokenResponse.java
└── common/
    └── dto/
        ├── PageResponse.java
        └── ErrorResponse.java
```

**Rules:**
- Request DTOs: Convert HTTP request to Application Commands
- Response DTOs: Convert Application Results to HTTP response
- NO business logic
- Validation annotations allowed

#### 3.2 Output Adapters (Persistence)

```
com.geonho.vocautobot.adapter.out.persistence
├── common/
│   └── BaseJpaEntity.java            # JPA base entity with audit
├── voc/
│   ├── entity/
│   │   ├── VocJpaEntity.java         # JPA entity
│   │   ├── VocAttachmentJpaEntity.java
│   │   └── VocMemoJpaEntity.java
│   ├── mapper/
│   │   └── VocMapper.java            # Domain <-> JPA Entity mapper
│   ├── VocJpaRepository.java         # Spring Data JPA repository
│   └── VocPersistenceAdapter.java    # Port implementation
├── user/
│   ├── entity/
│   │   └── UserJpaEntity.java
│   ├── UserJpaRepository.java
│   └── UserPersistenceAdapter.java
└── category/
    ├── entity/
    │   └── CategoryJpaEntity.java
    ├── CategoryJpaRepository.java
    └── CategoryPersistenceAdapter.java
```

**Rules:**
- JPA entities are infrastructure concerns
- Mappers convert between Domain models and JPA entities
- JPA repositories extend Spring Data interfaces
- Persistence adapters implement output ports

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Domain Model | `{Name}Domain` or `{Name}` | `VocDomain`, `User` |
| JPA Entity | `{Name}JpaEntity` | `VocJpaEntity` |
| Request DTO | `{Action}{Name}Request` | `CreateVocRequest` |
| Response DTO | `{Name}Response` | `VocResponse` |
| Command | `{Action}{Name}Command` | `CreateVocCommand` |
| Query | `{Name}Query` or `{Name}ListQuery` | `VocListQuery` |
| Result | `{Name}Result` | `VocResult` |
| Mapper | `{Name}Mapper` | `VocMapper` |
| Port | `{Action}{Name}Port` | `LoadVocPort`, `SaveVocPort` |
| Adapter | `{Name}PersistenceAdapter` | `VocPersistenceAdapter` |

## Data Flow

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapter Layer (Input)                                          │
│  CreateVocRequest → toCommand() → CreateVocCommand              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Application Layer                                               │
│  CreateVocCommand → UseCase → VocDomain → VocResult             │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapter Layer (Output - Persistence)                           │
│  VocDomain → VocMapper.toEntity() → VocJpaEntity → DB           │
│  DB → VocJpaEntity → VocMapper.toDomain() → VocDomain           │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapter Layer (Input - Response)                               │
│  VocResult → VocResponse.from() → HTTP Response                 │
└─────────────────────────────────────────────────────────────────┘
```

## Dependencies

```
voc-domain (Pure Java, Lombok)
     ▲
     │
voc-application (Spring Context, Transactions)
     ▲
     │
voc-adapter (Spring Boot, JPA, Web)
     ▲
     │
voc-bootstrap (Application Entry Point)
```

## Migration Guide

### Step 1: Create Pure Domain Models
- Create `VocDomain.java` without JPA annotations
- Move business logic from JPA entity to domain model

### Step 2: Create JPA Entities in Adapter
- Create `VocJpaEntity.java` with JPA annotations
- JPA entities should NOT contain business logic

### Step 3: Create Mappers
- Create `VocMapper.java` for conversion
- Handle null safety and relationship mapping

### Step 4: Update Persistence Adapters
- Use mappers for conversion
- Return domain models from ports

### Step 5: Remove JPA from Domain Layer
- Remove JPA dependencies from `voc-domain/build.gradle`
- Remove old JPA entities from domain package

## Checklist

- [ ] Domain layer has NO JPA dependencies
- [ ] All JPA entities are in adapter layer
- [ ] Mappers handle all conversions
- [ ] Controllers use Request/Response DTOs
- [ ] Use cases use Command/Query/Result DTOs
- [ ] Persistence adapters return domain models
