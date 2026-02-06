"""Category-based log pattern templates for rule-based analysis."""

from typing import Dict, List, Any

LOG_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "payment": {
        "common_keywords": [
            "payment", "gateway", "timeout", "transaction", "card", "pg",
            "refund", "settlement", "authorization", "decline", "balance",
            "virtual account", "3ds", "duplicate"
        ],
        "typical_causes": [
            "결제 게이트웨이 서버 응답 지연 또는 장애",
            "네트워크 연결 불안정으로 인한 타임아웃",
            "PG사 시스템 점검 또는 장애",
            "잘못된 카드 정보 또는 유효하지 않은 결제 수단",
            "잔액 부족 또는 한도 초과",
            "중복 결제 요청 감지"
        ],
        "recommended_actions": [
            "PG사 서버 상태 및 점검 일정 확인",
            "네트워크 연결 상태 점검",
            "타임아웃 설정값 검토 및 조정",
            "결제 재시도 로직 점검",
            "사용자에게 결제 수단 재확인 요청"
        ],
        "severity_keywords": {
            "critical": ["settlement", "gateway", "timeout"],
            "high": ["authorization", "decline", "duplicate"],
            "medium": ["refund", "balance", "retry"]
        }
    },
    "auth": {
        "common_keywords": [
            "jwt", "token", "login", "session", "expired", "authentication",
            "authorization", "oauth", "sso", "saml", "mfa", "otp",
            "password", "refresh", "credential", "locked"
        ],
        "typical_causes": [
            "JWT 토큰 만료",
            "세션 타임아웃 또는 Redis 연결 문제",
            "잘못된 로그인 정보 입력",
            "계정 잠금 (로그인 실패 횟수 초과)",
            "OAuth/SSO 설정 오류",
            "MFA 인증 실패"
        ],
        "recommended_actions": [
            "토큰 갱신 로직 점검",
            "세션 저장소(Redis) 연결 상태 확인",
            "사용자에게 비밀번호 재설정 안내",
            "계정 잠금 해제 처리",
            "SSO/OAuth 설정 검토"
        ],
        "severity_keywords": {
            "critical": ["sso", "saml", "session"],
            "high": ["locked", "mfa", "oauth"],
            "medium": ["expired", "refresh", "password"]
        }
    },
    "database": {
        "common_keywords": [
            "connection", "pool", "query", "timeout", "deadlock", "transaction",
            "constraint", "replication", "lock", "disk", "tablespace",
            "hikari", "postgresql", "mysql", "slow query"
        ],
        "typical_causes": [
            "데이터베이스 커넥션 풀 고갈",
            "느린 쿼리로 인한 타임아웃",
            "데드락 발생",
            "데이터베이스 서버 연결 끊김",
            "디스크 공간 부족",
            "리플리케이션 지연"
        ],
        "recommended_actions": [
            "커넥션 풀 크기 조정",
            "느린 쿼리 분석 및 인덱스 최적화",
            "트랜잭션 범위 및 잠금 전략 검토",
            "디스크 공간 확보",
            "리플리케이션 상태 점검"
        ],
        "severity_keywords": {
            "critical": ["pool exhausted", "deadlock", "disk space", "connection lost"],
            "high": ["timeout", "replication lag", "lock timeout"],
            "medium": ["slow query", "constraint violation"]
        }
    },
    "api": {
        "common_keywords": [
            "rate limit", "503", "429", "upstream", "circuit breaker",
            "gateway", "timeout", "load balancer", "ssl", "certificate",
            "request", "response", "fallback"
        ],
        "typical_causes": [
            "상위 서비스 장애 또는 응답 지연",
            "서킷 브레이커 발동",
            "API 호출 제한 초과",
            "로드 밸런서 설정 문제",
            "SSL 인증서 문제"
        ],
        "recommended_actions": [
            "상위 서비스 상태 확인",
            "서킷 브레이커 설정 검토",
            "API 호출 빈도 조정",
            "로드 밸런서 헬스 체크 설정 확인",
            "SSL 인증서 갱신"
        ],
        "severity_keywords": {
            "critical": ["circuit breaker", "load balancer", "503"],
            "high": ["timeout", "upstream", "ssl"],
            "medium": ["rate limit", "429", "fallback"]
        }
    },
    "cache": {
        "common_keywords": [
            "redis", "cache", "connection", "fallback", "eviction",
            "miss", "hit", "sentinel", "cluster", "memory", "expire",
            "serialization", "jedis"
        ],
        "typical_causes": [
            "Redis 서버 연결 실패",
            "캐시 클러스터 노드 장애",
            "메모리 부족으로 인한 캐시 제거",
            "직렬화/역직렬화 오류",
            "캐시 키 만료"
        ],
        "recommended_actions": [
            "Redis 서버 상태 확인",
            "클러스터 노드 복구",
            "메모리 사용량 모니터링 및 증설",
            "캐시 직렬화 포맷 검토",
            "캐시 TTL 설정 검토"
        ],
        "severity_keywords": {
            "critical": ["cluster", "sentinel failover"],
            "high": ["connection", "memory"],
            "medium": ["miss", "eviction", "expire"]
        }
    },
    "notification": {
        "common_keywords": [
            "smtp", "email", "push", "queue", "retry", "fcm", "sms",
            "twilio", "bounce", "template", "slack", "webhook"
        ],
        "typical_causes": [
            "SMTP 서버 연결 실패",
            "푸시 알림 토큰 무효화",
            "SMS 발송 실패 (잘못된 번호)",
            "알림 큐 과부하",
            "템플릿 렌더링 오류"
        ],
        "recommended_actions": [
            "메일 서버 연결 상태 확인",
            "FCM/APNs 토큰 유효성 검증",
            "발송 실패 건 재시도 처리",
            "알림 큐 처리량 조정",
            "템플릿 변수 검증"
        ],
        "severity_keywords": {
            "critical": ["queue full"],
            "high": ["smtp", "webhook"],
            "medium": ["bounce", "template", "fcm", "sms"]
        }
    },
    "file": {
        "common_keywords": [
            "upload", "download", "size limit", "storage", "s3",
            "virus", "scan", "thumbnail", "cdn", "quota", "corrupt"
        ],
        "typical_causes": [
            "파일 크기 제한 초과",
            "스토리지 권한 오류",
            "파일 형식 검증 실패",
            "바이러스 스캔 서비스 장애",
            "스토리지 용량 초과"
        ],
        "recommended_actions": [
            "파일 크기 제한 설정 확인",
            "스토리지 권한 설정 검토",
            "허용 파일 형식 목록 확인",
            "바이러스 스캔 서비스 상태 점검",
            "스토리지 용량 증설"
        ],
        "severity_keywords": {
            "critical": ["s3", "storage"],
            "high": ["virus", "quota"],
            "medium": ["size limit", "thumbnail", "cdn"]
        }
    },
    "search": {
        "common_keywords": [
            "elasticsearch", "timeout", "index", "query", "shard",
            "cluster", "analyzer", "aggregation", "scroll", "reindex"
        ],
        "typical_causes": [
            "ElasticSearch 쿼리 타임아웃",
            "클러스터 상태 이상 (RED/YELLOW)",
            "인덱스 매핑 오류",
            "샤드 할당 실패",
            "메모리 부족"
        ],
        "recommended_actions": [
            "쿼리 최적화 및 타임아웃 설정 조정",
            "클러스터 상태 확인 및 복구",
            "인덱스 매핑 검토",
            "샤드 배치 전략 조정",
            "힙 메모리 증설"
        ],
        "severity_keywords": {
            "critical": ["cluster health red", "shard"],
            "high": ["timeout", "analyzer", "memory"],
            "medium": ["scroll", "aggregation", "reindex"]
        }
    },
    "batch": {
        "common_keywords": [
            "job", "scheduler", "oom", "heap", "failed", "etl",
            "partition", "chunk", "rollback", "queue", "trigger"
        ],
        "typical_causes": [
            "메모리 부족 (OutOfMemoryError)",
            "배치 작업 실행 시간 초과",
            "데이터 소스 연결 실패",
            "데이터 검증 오류",
            "트랜잭션 크기 초과"
        ],
        "recommended_actions": [
            "JVM 힙 메모리 증설",
            "배치 처리 청크 크기 조정",
            "데이터 소스 연결 안정성 확인",
            "데이터 유효성 검증 로직 강화",
            "트랜잭션 분할 처리"
        ],
        "severity_keywords": {
            "critical": ["oom", "heap", "etl"],
            "high": ["rollback", "failed", "timeout"],
            "medium": ["partition", "chunk", "queue"]
        }
    },
    "security": {
        "common_keywords": [
            "blocked", "suspicious", "rate limit", "ddos", "attack",
            "sql injection", "xss", "csrf", "certificate", "vulnerable",
            "pii", "exposure"
        ],
        "typical_causes": [
            "보안 공격 시도 감지 (SQL Injection, XSS 등)",
            "비정상적인 접근 패턴",
            "DDoS 공격",
            "인증서 만료 임박",
            "민감 정보 노출"
        ],
        "recommended_actions": [
            "공격 패턴 분석 및 차단 규칙 강화",
            "의심 IP 차단",
            "DDoS 방어 시스템 활성화",
            "SSL 인증서 갱신",
            "민감 정보 로깅 제거"
        ],
        "severity_keywords": {
            "critical": ["ddos", "sql injection", "xss"],
            "high": ["blocked", "csrf", "certificate", "pii"],
            "medium": ["rate limit", "suspicious"]
        }
    }
}


def get_category_info(category: str) -> Dict[str, Any]:
    """Get template information for a specific category.

    Args:
        category: The category name.

    Returns:
        Category template information or empty dict if not found.
    """
    return LOG_TEMPLATES.get(category.lower(), {})


def get_all_keywords() -> List[str]:
    """Get all keywords from all categories.

    Returns:
        List of all keywords across all categories.
    """
    keywords = []
    for category_info in LOG_TEMPLATES.values():
        keywords.extend(category_info.get("common_keywords", []))
    return list(set(keywords))


def find_matching_categories(text: str) -> List[tuple[str, int]]:
    """Find categories that match the given text based on keywords.

    Args:
        text: Text to analyze.

    Returns:
        List of (category, match_count) tuples, sorted by match count descending.
    """
    text_lower = text.lower()
    matches = []

    for category, info in LOG_TEMPLATES.items():
        keywords = info.get("common_keywords", [])
        match_count = sum(1 for kw in keywords if kw.lower() in text_lower)
        if match_count > 0:
            matches.append((category, match_count))

    return sorted(matches, key=lambda x: x[1], reverse=True)


def get_severity_from_keywords(text: str, category: str) -> str:
    """Determine severity based on keywords in text for a specific category.

    Args:
        text: Text to analyze.
        category: Category to check severity keywords for.

    Returns:
        Severity level: 'critical', 'high', 'medium', or 'low'.
    """
    category_info = LOG_TEMPLATES.get(category.lower(), {})
    severity_keywords = category_info.get("severity_keywords", {})

    text_lower = text.lower()

    for severity in ["critical", "high", "medium"]:
        keywords = severity_keywords.get(severity, [])
        if any(kw.lower() in text_lower for kw in keywords):
            return severity

    return "low"
