package com.geonho.vocautobot.adapter.out.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Ollama LLM 연동 설정
 */
@Configuration
@ConfigurationProperties(prefix = "ollama")
public class OllamaConfig {

    private String baseUrl = "http://localhost:11434";
    private String model = "gpt-oss:20b";
    private String embeddingModel = "bge-m3:latest";
    private int timeout = 30000;
    private int maxRetries = 3;

    @Bean
    public WebClient ollamaWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }
}
