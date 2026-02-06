"""Category-based log templates for rule-based analysis fallback."""

from typing import Dict, List, Optional, Tuple, TypedDict


class LogTemplate(TypedDict):
    """Type definition for log template structure."""
    common_keywords: List[str]
    typical_causes: List[str]
    recommended_actions: List[str]
    korean_description: str


LOG_TEMPLATES: Dict[str, LogTemplate] = {
    "payment": {
        "common_keywords": [
            "timeout", "gateway", "transaction", "card", "pg", "payment",
            "refund", "authorization", "declined", "insufficient", "escrow",
            "virtual account", "callback", "duplicate", "circuit breaker"
        ],
        "typical_causes": [
            "결제 게이트웨이 서버 응답 지연 또는 장애",
            "네트워크 연결 불안정으로 인한 타임아웃",
            "카드사 또는 은행 시스템 점검/장애",
            "결제 한도 초과 또는 잔액 부족",
            "PG사 API 인증 오류",
            "중복 결제 요청 감지",
            "콜백 서명 검증 실패"
        ],
        "recommended_actions": [
            "결제 게이트웨이 서버 상태 및 연결 상태 확인",
            "트랜잭션 재시도 로직 및 타임아웃 설정 검토",
            "PG사 대시보드에서 거래 상태 확인",
            "고객에게 다른 결제 수단 안내",
            "서킷 브레이커 상태 확인 및 필요시 리셋"
        ],
        "korean_description": "결제/PG 관련 오류"
    },
    "auth": {
        "common_keywords": [
            "jwt", "token", "login", "session", "expired", "authentication",
            "oauth", "refresh", "credentials", "password", "otp", "sso",
            "saml", "locked", "2fa", "mfa"
        ],
        "typical_causes": [
            "JWT 토큰 만료 또는 무효화",
            "잘못된 로그인 자격 증명",
            "세션 타임아웃으로 인한 자동 로그아웃",
            "OAuth2 인증 코드 만료 또는 오류",
            "리프레시 토큰 무효화",
            "계정 잠금 (로그인 시도 초과)",
            "2단계 인증 실패"
        ],
        "recommended_actions": [
            "사용자에게 재로그인 요청",
            "토큰 갱신 로직 확인",
            "세션 타임아웃 설정 검토",
            "OAuth 설정 및 콜백 URL 확인",
            "계정 잠금 해제 프로세스 안내",
            "SSO/SAML 설정 검증"
        ],
        "korean_description": "인증/로그인 관련 오류"
    },
    "database": {
        "common_keywords": [
            "connection", "pool", "query", "timeout", "deadlock", "replication",
            "constraint", "duplicate", "migration", "slow", "postgresql",
            "mysql", "hikari", "transaction", "rollback"
        ],
        "typical_causes": [
            "데이터베이스 커넥션 풀 고갈",
            "데드락 발생으로 인한 트랜잭션 대기",
            "슬로우 쿼리로 인한 성능 저하",
            "복제 지연 (레플리카 동기화 지연)",
            "컬럼/테이블 미존재 오류",
            "데이터베이스 서버 연결 실패",
            "제약 조건 위반 (유니크, 외래키 등)"
        ],
        "recommended_actions": [
            "커넥션 풀 설정 검토 및 확장 고려",
            "슬로우 쿼리 분석 및 인덱스 최적화",
            "데드락 발생 쿼리 패턴 분석",
            "레플리케이션 상태 모니터링",
            "데이터베이스 마이그레이션 상태 확인",
            "DB 서버 상태 및 네트워크 연결 확인"
        ],
        "korean_description": "데이터베이스 관련 오류"
    },
    "api": {
        "common_keywords": [
            "rate limit", "503", "429", "upstream", "circuit breaker",
            "timeout", "gateway", "load balancer", "health check",
            "ssl", "certificate", "latency", "throttle"
        ],
        "typical_causes": [
            "업스트림 서비스 장애 또는 점검",
            "API 요청 속도 제한 초과",
            "서킷 브레이커 OPEN 상태",
            "API 요청 타임아웃",
            "인증 실패 (API 키 무효)",
            "SSL 인증서 만료 또는 오류",
            "로드 밸런서 상태 이상"
        ],
        "recommended_actions": [
            "업스트림 서비스 상태 확인",
            "API 요청 속도 조절 또는 한도 증가 요청",
            "서킷 브레이커 상태 확인 및 모니터링",
            "타임아웃 설정값 검토",
            "API 키 및 인증 정보 확인",
            "SSL 인증서 갱신 확인"
        ],
        "korean_description": "API/게이트웨이 관련 오류"
    },
    "cache": {
        "common_keywords": [
            "redis", "cache miss", "connection", "fallback", "eviction",
            "memory", "cluster", "serialization", "ttl", "distributed lock",
            "warmup", "jedis"
        ],
        "typical_causes": [
            "Redis 서버 연결 실패",
            "캐시 미스율 증가 (데이터 만료)",
            "Redis 클러스터 노드 장애",
            "메모리 사용량 초과",
            "분산 락 획득 실패",
            "캐시 직렬화 오류"
        ],
        "recommended_actions": [
            "Redis 서버 상태 및 연결 확인",
            "캐시 TTL 설정 검토",
            "Redis 클러스터 상태 모니터링",
            "메모리 사용량 확인 및 정리 정책 검토",
            "캐시 폴백 로직 확인",
            "분산 락 타임아웃 설정 조정"
        ],
        "korean_description": "캐시(Redis) 관련 오류"
    },
    "notification": {
        "common_keywords": [
            "smtp", "email", "push", "queue", "retry", "fcm", "sms",
            "slack", "kakao", "template", "bounce", "webhook"
        ],
        "typical_causes": [
            "SMTP 서버 연결 타임아웃",
            "푸시 알림 서비스 오류 (FCM/APNS)",
            "메시지 큐 백로그 증가",
            "알림 템플릿 렌더링 오류",
            "이메일 바운스 (잘못된 수신자)",
            "외부 알림 서비스 API 인증 오류"
        ],
        "recommended_actions": [
            "SMTP 서버 연결 상태 확인",
            "푸시 알림 서비스 설정 검토",
            "메시지 큐 상태 모니터링",
            "알림 템플릿 변수 확인",
            "이메일 발송 로그 확인",
            "외부 서비스 API 키 확인"
        ],
        "korean_description": "알림/메시지 관련 오류"
    },
    "file": {
        "common_keywords": [
            "upload", "download", "size limit", "storage", "s3",
            "permission", "virus", "quota", "cdn", "image", "processing"
        ],
        "typical_causes": [
            "파일 크기 제한 초과",
            "스토리지 접근 권한 오류",
            "파일 타입 제한 위반",
            "스토리지 용량 부족/할당량 초과",
            "바이러스 감지",
            "이미지 처리 오류"
        ],
        "recommended_actions": [
            "파일 크기 제한 설정 확인",
            "스토리지 권한 및 정책 검토",
            "허용된 파일 타입 목록 확인",
            "스토리지 용량 확장 검토",
            "CDN 설정 확인",
            "이미지 처리 라이브러리 상태 확인"
        ],
        "korean_description": "파일 업로드/다운로드 관련 오류"
    },
    "search": {
        "common_keywords": [
            "elasticsearch", "timeout", "index", "query", "mapping",
            "cluster", "shard", "replication", "aggregation", "suggest"
        ],
        "typical_causes": [
            "ElasticSearch 쿼리 타임아웃",
            "인덱스 미존재 또는 매핑 오류",
            "클러스터 상태 불량 (RED/YELLOW)",
            "샤드 할당 실패",
            "메모리 부족으로 인한 회로 차단기 작동",
            "검색 큐 포화"
        ],
        "recommended_actions": [
            "ElasticSearch 클러스터 상태 확인",
            "인덱스 존재 여부 및 매핑 확인",
            "샤드 할당 상태 점검",
            "쿼리 최적화 및 타임아웃 설정 조정",
            "메모리 설정 검토",
            "검색 쿼리 동시 실행 수 제한 검토"
        ],
        "korean_description": "검색(ElasticSearch) 관련 오류"
    },
    "batch": {
        "common_keywords": [
            "job", "scheduler", "oom", "heap", "failed", "etl",
            "pipeline", "timeout", "kafka", "consumer", "lag"
        ],
        "typical_causes": [
            "배치 작업 메모리 부족 (OOM)",
            "작업 실행 타임아웃",
            "ETL 파이프라인 소스 연결 실패",
            "이전 작업 미완료로 인한 스킵",
            "데이터 형식 오류",
            "Kafka 컨슈머 랙 증가"
        ],
        "recommended_actions": [
            "JVM 힙 메모리 설정 증가 검토",
            "배치 작업 타임아웃 설정 조정",
            "데이터 소스 연결 상태 확인",
            "배치 작업 스케줄 충돌 검토",
            "입력 데이터 유효성 검증 강화",
            "Kafka 컨슈머 성능 최적화"
        ],
        "korean_description": "배치/스케줄러 관련 오류"
    },
    "security": {
        "common_keywords": [
            "blocked", "suspicious", "rate limit", "ddos", "injection",
            "xss", "attack", "certificate", "privilege", "exfiltration",
            "audit", "firewall"
        ],
        "typical_causes": [
            "브루트포스 공격으로 인한 IP 차단",
            "SQL 인젝션 공격 시도 감지",
            "XSS 공격 시도 감지",
            "DDoS 공격 의심",
            "인증서 체인 검증 실패",
            "권한 상승 시도",
            "비정상적인 데이터 접근 패턴"
        ],
        "recommended_actions": [
            "보안 로그 상세 분석",
            "의심 IP 차단 및 모니터링",
            "방화벽 규칙 검토",
            "입력 검증 로직 강화",
            "인증서 갱신 및 체인 확인",
            "접근 권한 감사 실시",
            "보안 모니터링 알림 설정 확인"
        ],
        "korean_description": "보안 관련 이벤트"
    }
}


def get_template_by_category(category: str) -> Optional[LogTemplate]:
    """Get log template by category name.

    Args:
        category: Category name (e.g., 'payment', 'auth')

    Returns:
        LogTemplate if found, None otherwise
    """
    return LOG_TEMPLATES.get(category.lower())


def get_all_categories() -> List[str]:
    """Get list of all available categories.

    Returns:
        List of category names
    """
    return list(LOG_TEMPLATES.keys())


def find_category_by_keywords(text: str) -> Optional[Tuple[str, float]]:
    """Find most likely category based on keyword matching.

    Args:
        text: Text to analyze for keywords

    Returns:
        Tuple of (category_name, match_score) or None if no match
    """
    text_lower = text.lower()
    best_match = None
    best_score = 0.0

    for category, template in LOG_TEMPLATES.items():
        keywords = template["common_keywords"]
        matched_keywords = sum(1 for kw in keywords if kw.lower() in text_lower)

        if matched_keywords > 0:
            # Calculate score based on matched keywords / total keywords
            score = matched_keywords / len(keywords)

            if score > best_score:
                best_score = score
                best_match = category

    if best_match:
        return (best_match, best_score)
    return None
