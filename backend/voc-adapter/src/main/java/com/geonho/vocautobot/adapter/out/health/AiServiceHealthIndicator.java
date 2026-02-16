package com.geonho.vocautobot.adapter.out.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component("aiService")
public class AiServiceHealthIndicator extends AbstractHealthIndicator {

    private final RestTemplate restTemplate;
    private final String serviceUrl;

    public AiServiceHealthIndicator(@Value("${ai.service.url:http://localhost:8001}") String serviceUrl) {
        super("AI Service health check failed");
        this.serviceUrl = serviceUrl;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            restTemplate.getForEntity(serviceUrl + "/health", String.class);
            builder.up().withDetail("endpoint", serviceUrl);
        } catch (Exception ex) {
            builder.down(ex).withDetail("endpoint", serviceUrl);
        }
    }
}
