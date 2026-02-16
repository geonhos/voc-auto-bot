package com.geonho.vocautobot.adapter.out.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component("ollama")
public class OllamaHealthIndicator extends AbstractHealthIndicator {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public OllamaHealthIndicator(@Value("${ollama.base-url:http://localhost:11434}") String baseUrl) {
        super("Ollama health check failed");
        this.baseUrl = baseUrl;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            restTemplate.getForEntity(baseUrl, String.class);
            builder.up().withDetail("endpoint", baseUrl);
        } catch (Exception ex) {
            builder.down(ex).withDetail("endpoint", baseUrl);
        }
    }
}
