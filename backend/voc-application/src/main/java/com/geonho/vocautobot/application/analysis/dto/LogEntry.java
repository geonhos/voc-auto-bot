package com.geonho.vocautobot.application.analysis.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 로그 엔트리 도메인 모델
 * OpenSearch로부터 조회한 로그 정보를 표현
 */
public record LogEntry(
    String id,
    LocalDateTime timestamp,
    String logLevel,
    String serviceName,
    String message,
    String logger,
    String thread,
    Map<String, Object> additionalFields
) {

    /**
     * 에러 로그인지 확인
     */
    public boolean isError() {
        return "ERROR".equalsIgnoreCase(logLevel);
    }

    /**
     * 경고 로그인지 확인
     */
    public boolean isWarning() {
        return "WARN".equalsIgnoreCase(logLevel);
    }

    /**
     * 특정 서비스의 로그인지 확인
     */
    public boolean isFromService(String serviceName) {
        return this.serviceName != null && this.serviceName.equals(serviceName);
    }

    /**
     * 메시지에 특정 키워드가 포함되어 있는지 확인
     */
    public boolean containsKeyword(String keyword) {
        return message != null && message.toLowerCase().contains(keyword.toLowerCase());
    }
}
