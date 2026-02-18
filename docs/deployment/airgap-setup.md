# Air-Gapped Deployment Guide

VOC Auto Bot을 인터넷이 차단된 폐쇄망 환경에 배포하는 절차.

## Prerequisites

대상 서버에 다음이 설치되어 있어야 합니다:
- Docker Engine 24.0+
- Docker Compose v2.20+
- 디스크 여유 공간 20GB 이상

## 1. 인터넷 연결 환경에서 준비

### 1-1. Docker 이미지 내보내기

```bash
# 프로젝트 루트에서 실행
./scripts/registry/export-images.sh 1.0.0
```

산출물 (`image-export/` 디렉토리):
- `docker-images-1.0.0.tar.gz` - 모든 기반 이미지
- `docker-images-1.0.0.sha256` - 무결성 검증용 체크섬
- `manifest.json` - 포함된 이미지 목록

### 1-2. 앱 이미지 빌드 및 내보내기

```bash
docker compose build backend frontend ai-service
docker save -o image-export/app-images.tar \
  voc-auto-bot-backend voc-auto-bot-frontend voc-auto-bot-ai-service
gzip image-export/app-images.tar
```

### 1-3. Ollama 모델 내보내기

```bash
# 사용 중인 모델 확인
ollama list

# 모델 파일 복사 (~/.ollama/models/)
tar czf image-export/ollama-models.tar.gz -C ~/.ollama models/
```

## 2. 물리 매체로 전송

USB, 외장 HDD, DVD 등으로 다음 파일을 전송합니다:
- `image-export/` 디렉토리 전체
- 프로젝트 소스 코드 (git archive 또는 tar)

```bash
# 소스 코드 아카이브
git archive --format=tar.gz -o image-export/source.tar.gz HEAD
```

## 3. 폐쇄망 서버에서 설치

### 3-1. 이미지 가져오기

```bash
# 기반 이미지 로드
./scripts/registry/import-images.sh /media/usb/image-export/

# 앱 이미지 로드
docker load -i /media/usb/image-export/app-images.tar.gz
```

### 3-2. Ollama 모델 복원

```bash
tar xzf /media/usb/image-export/ollama-models.tar.gz -C ~/.ollama/
```

### 3-3. 시크릿 생성

```bash
./scripts/init-secrets.sh
```

### 3-4. 환경 설정

```bash
cp .env.example .env
# .env 파일에서 OLLAMA_BASE_URL 등 환경에 맞게 수정
```

### 3-5. 서비스 시작

```bash
docker compose --profile app up -d
```

## 4. 검증

```bash
# 컨테이너 상태 확인
docker compose ps

# 헬스 체크
curl -s http://localhost:8080/api/actuator/health | jq .
curl -s http://localhost:3000/ > /dev/null && echo "Frontend OK"
curl -s http://localhost:8001/health | jq .
```

## 업데이트 절차

1. 인터넷 환경에서 새 버전 빌드 및 이미지 내보내기
2. 물리 매체로 전송
3. `docker compose down` -> 이미지 로드 -> `docker compose --profile app up -d`
