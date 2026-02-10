package com.geonho.vocautobot.adapter.out.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Python AI 서비스 연동 설정
 */
@Configuration
@ConfigurationProperties(prefix = "ai.service")
@Getter
@Setter
public class PythonAiServiceConfig {

    /**
     * AI 서비스 Base URL
     * 예: http://localhost:8001
     */
    private String url = "http://localhost:8001";

    /**
     * 분석 API 엔드포인트
     */
    private String analyzeEndpoint = "/api/v1/analyze";

    /**
     * HTTP 요청 타임아웃 (밀리초)
     */
    private int timeout = 30000;

    /**
     * AI Service API Key (X-API-Key 헤더로 전송)
     */
    private String apiKey = "";

    @Bean
    public RestTemplate aiServiceRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        RestTemplate restTemplate = new RestTemplate(factory);

        // Add API Key interceptor if configured
        if (apiKey != null && !apiKey.isBlank()) {
            restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().set("X-API-Key", apiKey);
                return execution.execute(request, body);
            });
        }

        return restTemplate;
    }

    /**
     * 분석 API의 전체 URL 반환
     */
    public String getAnalyzeUrl() {
        return url + analyzeEndpoint;
    }
}
