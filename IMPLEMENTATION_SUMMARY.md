# Slack Webhook 알림 구현 완료 (#131)

## 구현 개요
VOC 생성, 상태 변경, 할당 시 Slack Webhook을 통해 실시간 알림을 전송하는 기능을 구현했습니다.

## 구현된 파일 목록

### 1. Application Layer (Port Interface)
- **NotificationPort.java** (`voc-application/src/main/java/.../notification/port/out/`)
  - 알림 전송을 위한 포트 인터페이스
  - `notifyVocCreated()`, `notifyVocStatusChanged()`, `notifyVocAssigned()` 메서드 정의

### 2. Adapter Layer (Implementation)
- **SlackNotificationAdapter.java** (`voc-adapter/src/main/java/.../adapter/out/notification/`)
  - NotificationPort 구현체
  - Slack Webhook API 호출
  - 우선순위별 이모지 표시 (🔴 URGENT, 🟠 HIGH, 🟡 NORMAL, 🟢 LOW)
  - 긴 내용 자동 잘림 (100자)
  - 알림 실패 시 트랜잭션 롤백 방지

- **SlackProperties.java** (`voc-adapter/src/main/java/.../adapter/out/notification/`)
  - Slack 설정 프로퍼티
  - `@ConfigurationProperties(prefix = "slack")`로 환경변수 바인딩

### 3. Application Service 수정
- **VocService.java** 수정
  - `NotificationPort` 주입
  - `createVoc()`: VOC 생성 후 알림 전송
  - `changeStatus()`: 상태 변경 후 이전 상태와 함께 알림 전송
  - `assignVoc()`: 담당자 할당 후 알림 전송

### 4. Configuration
- **application.yml** 수정
  ```yaml
  slack:
    enabled: ${SLACK_ENABLED:true}
    webhook-url: ${SLACK_WEBHOOK_URL:}
    username: ${SLACK_BOT_USERNAME:VOC Auto Bot}
    icon-emoji: ${SLACK_BOT_ICON::bell:}
  ```

### 5. Tests
- **SlackNotificationAdapterTest.java** (Unit Test)
  - MockWebServer를 사용한 Webhook 호출 테스트
  - 9개 테스트 케이스 작성
  - 알림 전송 성공/실패, 비활성화, 우선순위 이모지, 내용 잘림 등 검증

- **VocServiceSlackNotificationTest.java** (Integration Test)
  - VocService와 NotificationPort 통합 테스트
  - 6개 테스트 케이스 작성
  - 알림 전송 확인 및 실패 시 트랜잭션 롤백 방지 검증

### 6. Documentation
- **SLACK_NOTIFICATION_GUIDE.md**
  - 아키텍처 설명
  - 설정 방법 (Local, Docker, Kubernetes)
  - 알림 메시지 형식
  - 테스트 방법
  - 문제 해결 가이드

## 주요 기능

### 1. VOC 생성 알림
- 티켓 ID, 제목, 우선순위, 카테고리, 고객 정보, 내용 포함
- 생성 시간 표시

### 2. VOC 상태 변경 알림
- 상태 변경 (이전 상태 → 새 상태)
- 우선순위, 담당자 정보 포함

### 3. VOC 할당 알림
- 할당된 담당자 이름 표시
- 우선순위, 현재 상태 포함

## 설계 원칙 준수

### Hexagonal Architecture
- **Port**: `NotificationPort` 인터페이스 (Application Layer)
- **Adapter**: `SlackNotificationAdapter` 구현체 (Adapter Layer)
- 의존성 역전: Application이 Adapter를 의존하지 않음

### DDD (Domain-Driven Design)
- Domain Layer는 알림 로직을 알지 못함
- Application Layer에서 비즈니스 로직 실행 후 알림 전송
- 도메인 이벤트 패턴 적용 가능 (향후 확장)

### TDD (Test-Driven Development)
- Unit Test: `SlackNotificationAdapterTest` (9개)
- Integration Test: `VocServiceSlackNotificationTest` (6개)
- 총 15개 테스트 케이스 작성

### Clean Architecture
- 단일 책임 원칙: 각 클래스는 하나의 책임만 가짐
- 개방-폐쇄 원칙: 새로운 알림 채널 추가 용이
- 의존성 역전 원칙: 추상화에 의존

## 환경 변수 설정

### 필수 환경 변수
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 선택 환경 변수
```bash
SLACK_ENABLED=true
SLACK_BOT_USERNAME=VOC Auto Bot
SLACK_BOT_ICON=:bell:
```

## 트랜잭션 처리
- 알림 전송 실패 시 예외를 던지지 않음
- VOC 처리는 정상 진행 (트랜잭션 롤백 방지)
- 실패는 로그로만 기록

## 확장 가능성
1. 다른 알림 채널 추가 (Email, Kakao, SMS 등)
2. 알림 템플릿 커스터마이징
3. 비동기 처리 (@Async)
4. 재시도 로직 (Spring Retry)
5. 알림 이력 저장

## 테스트 실행 방법
```bash
# Unit Test
gradle :voc-adapter:test --tests SlackNotificationAdapterTest

# Integration Test
gradle :voc-application:test --tests VocServiceSlackNotificationTest

# All Tests
gradle test
```

## 문제 해결
- Slack Webhook URL이 설정되지 않으면 알림을 보내지 않음
- `slack.enabled=false`로 알림 비활성화 가능
- 로그 레벨 DEBUG로 설정하여 상세 로그 확인

## 완료 체크리스트
- [x] NotificationPort 인터페이스 작성
- [x] SlackNotificationAdapter 구현
- [x] SlackProperties 설정 클래스 작성
- [x] VocService에 알림 로직 통합
- [x] application.yml 설정 추가
- [x] Unit Test 작성 (SlackNotificationAdapterTest)
- [x] Integration Test 작성 (VocServiceSlackNotificationTest)
- [x] 문서 작성 (SLACK_NOTIFICATION_GUIDE.md)
- [x] 트랜잭션 롤백 방지 처리
- [x] 알림 비활성화 옵션 제공

## 다음 단계
1. Slack Webhook URL 설정
2. 테스트 환경에서 동작 확인
3. 프로덕션 배포 전 부하 테스트
4. 모니터링 및 로그 확인
