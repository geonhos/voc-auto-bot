# OpenSearch Log Analysis Adapter

OpenSearch를 활용한 로그 검색 및 분석 어댑터입니다.

## 구조

### Application Layer (Port)

#### LogSearchPort
```java
public interface LogSearchPort {
    LogAnalysisResult searchLogs(String query, LocalDateTime startTime, LocalDateTime endTime, int maxResults);
    LogAnalysisResult searchErrorLogs(String serviceName, LocalDateTime startTime, LocalDateTime endTime, int maxResults);
    LogAnalysisResult getLogStatistics(LocalDateTime startTime, LocalDateTime endTime);
    LogAnalysisResult searchServiceLogs(String serviceName, String logLevel, LocalDateTime startTime, LocalDateTime endTime, int maxResults);
}
```

#### DTOs
- **LogEntry**: 개별 로그 엔트리 정보
  - id, timestamp, logLevel, serviceName, message, logger, thread
  - Helper methods: isError(), isWarning(), isFromService(), containsKeyword()

- **LogAnalysisResult**: 로그 분석 결과
  - logs, errorCounts, logLevelCounts, serviceCounts, totalCount, summary
  - Helper methods: getErrorLogs(), getLogsForService(), hasErrors(), getMostErrorProneService()

### Adapter Layer (Implementation)

#### OpenSearchAdapter
- LogSearchPort 구현
- OpenSearch Java Client를 사용한 실제 검색 기능
- 쿼리 빌더 메서드: buildQueryStringQuery(), buildTimeRangeQuery(), buildLogLevelQuery(), buildServiceQuery()

#### LogSearchMapper
- OpenSearch 검색 결과를 도메인 모델로 변환
- 다양한 필드명 매핑 지원 (@timestamp/timestamp, level/log_level 등)
- 통계 계산 기능

#### OpenSearchProperties
- OpenSearch 연결 설정 프로퍼티
- ConfigurationProperties를 통한 외부 설정 주입

#### OpenSearchConfig
- OpenSearchClient 빈 생성 및 설정
- SSL, 인증 설정 지원
- 조건부 활성화 (@ConditionalOnProperty)

## 사용 방법

### 1. 의존성 추가 (pom.xml)

```xml
<!-- OpenSearch Java Client -->
<dependency>
    <groupId>org.opensearch.client</groupId>
    <artifactId>opensearch-java</artifactId>
    <version>2.11.0</version>
</dependency>

<!-- OpenSearch Rest Client -->
<dependency>
    <groupId>org.opensearch.client</groupId>
    <artifactId>opensearch-rest-client</artifactId>
    <version>2.11.0</version>
</dependency>

<!-- Apache HttpClient (for OpenSearch) -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
</dependency>

<!-- Test: OpenSearch Testcontainers -->
<dependency>
    <groupId>org.opensearch</groupId>
    <artifactId>opensearch-testcontainers</artifactId>
    <version>2.0.1</version>
    <scope>test</scope>
</dependency>
```

### 2. 설정 (application.yml)

```yaml
opensearch:
  enabled: true
  host: localhost
  port: 9200
  scheme: http
  index-prefix: logs-
  username: admin        # 선택사항
  password: password     # 선택사항
  use-ssl: false
```

### 3. 서비스 레이어에서 사용

```java
@Service
@RequiredArgsConstructor
public class LogAnalysisService {

    private final LogSearchPort logSearchPort;

    public LogAnalysisResult analyzeRecentErrors() {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(24);

        return logSearchPort.searchErrorLogs(
            null,           // 모든 서비스
            startTime,
            endTime,
            1000
        );
    }

    public LogAnalysisResult searchByKeyword(String keyword) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(1);

        return logSearchPort.searchLogs(
            keyword,
            startTime,
            endTime,
            100
        );
    }
}
```

## 로그 인덱스 구조

OpenSearch에 저장되는 로그는 다음과 같은 필드를 가져야 합니다:

```json
{
  "@timestamp": "2024-01-25T10:30:00Z",
  "level": "ERROR",
  "service": "voc-service",
  "message": "Database connection failed",
  "logger": "com.geonho.vocautobot.db.ConnectionPool",
  "thread": "pool-1-thread-1",
  "trace_id": "abc123",
  "span_id": "def456"
}
```

### 지원하는 필드명 (자동 매핑)
- Timestamp: `@timestamp`, `timestamp`, `time`
- Log Level: `level`, `log_level`, `logLevel`
- Service Name: `service`, `service_name`, `serviceName`
- Message: `message`, `msg`
- Logger: `logger`, `logger_name`, `loggerName`
- Thread: `thread`, `thread_name`, `threadName`

## 테스트

### 단위 테스트
```bash
mvn test -Dtest=LogSearchMapperTest
mvn test -Dtest=OpenSearchAdapterTest
```

### 통합 테스트 (Testcontainers)
```bash
mvn test -Dtest=OpenSearchAdapterIntegrationTest
```

통합 테스트는 Testcontainers를 사용하여 실제 OpenSearch 컨테이너를 띄우고 테스트합니다.

## Architecture Compliance

이 구현은 다음 원칙을 따릅니다:

1. **Hexagonal Architecture**
   - Application Layer: Port 인터페이스 정의
   - Adapter Layer: 실제 구현

2. **Domain-Driven Design**
   - LogEntry: 불변 도메인 모델 (record)
   - LogAnalysisResult: 풍부한 도메인 로직 포함

3. **Clean Code**
   - 명확한 메서드명
   - 단일 책임 원칙
   - 의존성 역전 원칙

4. **Test-Driven Development**
   - 단위 테스트: 개별 컴포넌트 테스트
   - 통합 테스트: 실제 OpenSearch와 연동 테스트
   - Testcontainers를 활용한 격리된 테스트 환경

## 주요 기능

1. **로그 검색**
   - 키워드 기반 검색
   - 시간 범위 필터링
   - 로그 레벨 필터링
   - 서비스명 필터링

2. **에러 로그 분석**
   - 서비스별 에러 집계
   - 에러 카운팅
   - 가장 많은 에러 발생 서비스 식별

3. **로그 통계**
   - 로그 레벨별 통계
   - 서비스별 통계
   - 전체 로그 개수

4. **고급 쿼리**
   - Query String Query 지원
   - Bool Query를 통한 복합 조건
   - Range Query를 통한 시간 범위 검색

## 에러 처리

- **OpenSearchException**: OpenSearch 연결 및 쿼리 실행 중 발생하는 예외
- 자동 재시도: 설정된 횟수만큼 자동 재시도
- 상세한 로깅: SLF4J를 통한 에러 로깅

## 성능 최적화

1. **Connection Pooling**: 연결 풀 사용
2. **Batch Size**: 대량 데이터 조회 시 배치 크기 설정
3. **Timeout 설정**: 적절한 타임아웃 설정으로 응답 보장
4. **Index Pattern**: 와일드카드 인덱스 패턴으로 효율적 검색

## 보안

1. **인증 지원**: Username/Password 기본 인증
2. **SSL/TLS**: HTTPS 연결 지원
3. **인증서 검증**: SSL 인증서 검증 옵션
4. **환경 변수**: 민감 정보는 환경 변수로 관리 권장
