package com.geonho.vocautobot.adapter.out.search;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OpenSearch 연결 설정 프로퍼티
 */
@Component
@ConfigurationProperties(prefix = "opensearch")
@Getter
@Setter
public class OpenSearchProperties {

    /**
     * OpenSearch 호스트
     */
    private String host = "localhost";

    /**
     * OpenSearch 포트
     */
    private int port = 9200;

    /**
     * 연결 스키마 (http 또는 https)
     */
    private String scheme = "http";

    /**
     * 사용자명 (선택사항)
     */
    private String username;

    /**
     * 비밀번호 (선택사항)
     */
    private String password;

    /**
     * 인덱스 접두사 (예: logs-)
     */
    private String indexPrefix = "logs-";

    /**
     * 연결 타임아웃 (밀리초)
     */
    private int connectionTimeout = 5000;

    /**
     * 소켓 타임아웃 (밀리초)
     */
    private int socketTimeout = 60000;

    /**
     * 최대 재시도 횟수
     */
    private int maxRetries = 3;

    /**
     * 배치 크기 (벌크 작업용)
     */
    private int batchSize = 1000;

    /**
     * SSL 사용 여부
     */
    private boolean useSsl = false;

    /**
     * SSL 인증서 검증 여부
     */
    private boolean verifySslCertificate = true;

    /**
     * 기본 인덱스명 생성
     */
    public String getDefaultIndexPattern() {
        return indexPrefix + "*";
    }

    /**
     * 인증 필요 여부 확인
     */
    public boolean requiresAuthentication() {
        return username != null && !username.isEmpty() && password != null && !password.isEmpty();
    }

    /**
     * 연결 URL 생성
     */
    public String getConnectionUrl() {
        return scheme + "://" + host + ":" + port;
    }
}
