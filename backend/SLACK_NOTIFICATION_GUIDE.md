# Slack Webhook 알림 기능 가이드

## 개요
VOC Auto Bot은 VOC 이벤트(생성, 상태 변경, 할당)가 발생할 때 Slack 채널로 실시간 알림을 전송합니다.

## 아키텍처

### Hexagonal Architecture 적용
```
Domain Layer (voc-domain)
    └── Voc Entity (비즈니스 로직)
         ↓
Application Layer (voc-application)
    ├── VocService (Use Case)
    └── NotificationPort (Interface)
         ↓
Adapter Layer (voc-adapter)
    └── SlackNotificationAdapter (Implementation)
```

### 주요 컴포넌트

#### 1. NotificationPort (Interface)
- **위치**: `voc-application/src/main/java/.../notification/port/out/NotificationPort.java`
- **역할**: 알림 전송을 위한 포트 인터페이스
- **메서드**:
  - `notifyVocCreated(Voc voc)` - VOC 생성 알림
  - `notifyVocStatusChanged(Voc voc, String previousStatus)` - 상태 변경 알림
  - `notifyVocAssigned(Voc voc, String assigneeName)` - 할당 알림

#### 2. SlackNotificationAdapter
- **위치**: `voc-adapter/src/main/java/.../adapter/out/notification/SlackNotificationAdapter.java`
- **역할**: Slack Webhook API를 통한 알림 전송 구현
- **특징**:
  - Webhook URL을 통한 메시지 전송
  - 우선순위별 이모지 표시 (🔴 URGENT, 🟠 HIGH, 🟡 NORMAL, 🟢 LOW)
  - 긴 내용 자동 잘림 (100자 이상)
  - 알림 실패 시 트랜잭션 롤백 방지

#### 3. SlackProperties
- **위치**: `voc-adapter/src/main/java/.../adapter/out/notification/SlackProperties.java`
- **역할**: Slack 설정 관리
- **설정 항목**:
  - `slack.webhook-url` - Slack Webhook URL (필수)
  - `slack.enabled` - 알림 활성화 여부 (기본값: true)
  - `slack.username` - 봇 이름 (기본값: "VOC Auto Bot")
  - `slack.icon-emoji` - 봇 아이콘 (기본값: ":bell:")

## 설정 방법

### 1. Slack Webhook URL 생성

1. Slack Workspace에서 App 생성
   - https://api.slack.com/apps 접속
   - "Create New App" 클릭
   - "From scratch" 선택
   - App 이름 입력 및 Workspace 선택

2. Incoming Webhooks 활성화
   - "Incoming Webhooks" 메뉴 선택
   - "Activate Incoming Webhooks" 토글 ON
   - "Add New Webhook to Workspace" 클릭
   - 알림을 받을 채널 선택

3. Webhook URL 복사
   - 생성된 Webhook URL 복사 (예: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`)

### 2. 환경 변수 설정

#### Local 환경 (.env 파일)
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ENABLED=true
SLACK_BOT_USERNAME=VOC Auto Bot
SLACK_BOT_ICON=:bell:
```

#### Docker 환경 (docker-compose.yml)
```yaml
services:
  backend:
    environment:
      - SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
      - SLACK_ENABLED=true
      - SLACK_BOT_USERNAME=VOC Auto Bot
      - SLACK_BOT_ICON=:bell:
```

#### Production 환경 (Kubernetes Secret)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: slack-config
type: Opaque
stringData:
  SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 3. application.yml 설정

```yaml
slack:
  enabled: ${SLACK_ENABLED:true}
  webhook-url: ${SLACK_WEBHOOK_URL:}
  username: ${SLACK_BOT_USERNAME:VOC Auto Bot}
  icon-emoji: ${SLACK_BOT_ICON::bell:}
```

## 알림 메시지 형식

### 1. VOC 생성 알림
```
*[NEW VOC] VOC-001*

*Title:* 시스템 오류 문의
*Priority:* 🟡 NORMAL
*Category:* 1
*Customer:* 홍길동 (hong@example.com)
*Created:* 2026-01-28 14:30

*Content:*
```로그인이 되지 않습니다...```
```

### 2. VOC 상태 변경 알림
```
*[STATUS CHANGED] VOC-001*

*Title:* 시스템 오류 문의
*Status Change:* NEW → *IN_PROGRESS*
*Priority:* 🟡 NORMAL
*Assignee ID:* 123
*Updated:* 2026-01-28 14:35
```

### 3. VOC 할당 알림
```
*[ASSIGNED] VOC-001*

*Title:* 시스템 오류 문의
*Assigned to:* @john.doe
*Priority:* 🟡 NORMAL
*Status:* IN_PROGRESS
*Assigned at:* 2026-01-28 14:35
```

## 테스트

### Unit Test 실행
```bash
./gradlew :voc-adapter:test --tests SlackNotificationAdapterTest
./gradlew :voc-application:test --tests VocServiceSlackNotificationTest
```

### Integration Test
```bash
./gradlew :voc-adapter:test
```

### Manual Test (cURL)
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "*[TEST]* Slack 알림 테스트",
    "username": "VOC Auto Bot",
    "icon_emoji": ":bell:"
  }'
```

## 문제 해결

### 1. 알림이 전송되지 않음
- `SLACK_WEBHOOK_URL` 환경변수 확인
- Webhook URL 유효성 확인 (Slack App 설정)
- `slack.enabled` 설정 확인
- 로그 확인: `com.geonho.vocautobot.adapter.out.notification`

### 2. 알림은 보내지만 에러 발생
- Slack API 응답 확인 (500 에러 등)
- Webhook URL 권한 확인
- 채널 존재 여부 확인

### 3. 트랜잭션 롤백 방지
- `SlackNotificationAdapter`는 예외를 던지지 않음
- 알림 실패 시 로그만 남기고 VOC 처리는 정상 진행
- 로그 레벨 DEBUG로 설정하여 상세 로그 확인

## 로깅

### 로그 레벨 설정
```yaml
logging:
  level:
    com.geonho.vocautobot.adapter.out.notification: DEBUG
```

### 주요 로그 메시지
- `Sending Slack notification for VOC created: {ticketId}`
- `Slack notification sent successfully for VOC: {ticketId}`
- `Failed to send Slack notification: {ticketId}`
- `Slack notification disabled, skipping notification`
- `Slack webhook URL not configured, skipping notification`

## 성능 고려사항

1. **비동기 처리 (선택사항)**
   - 현재는 동기 방식으로 구현
   - 필요시 `@Async` 어노테이션 추가 가능

2. **타임아웃 설정**
   - RestTemplate 기본 타임아웃 사용
   - 필요시 커스텀 RestTemplate 설정 가능

3. **재시도 로직**
   - 현재는 재시도 없음
   - 필요시 Spring Retry 적용 가능

## 확장 가능성

### 다른 알림 채널 추가
```java
@Component
public class EmailNotificationAdapter implements NotificationPort {
    // Email 알림 구현
}

@Component
public class KakaoNotificationAdapter implements NotificationPort {
    // Kakao 알림 구현
}
```

### 알림 템플릿 커스터마이징
- `SlackNotificationAdapter`의 메시지 빌더 메서드 수정
- 외부 템플릿 파일 사용 가능

## 참고 자료
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Slack Message Formatting](https://api.slack.com/reference/surfaces/formatting)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
