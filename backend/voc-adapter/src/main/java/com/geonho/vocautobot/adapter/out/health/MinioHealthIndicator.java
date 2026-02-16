package com.geonho.vocautobot.adapter.out.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component("minio")
public class MinioHealthIndicator extends AbstractHealthIndicator {

    private final RestTemplate restTemplate;
    private final String endpoint;

    public MinioHealthIndicator(@Value("${storage.minio.endpoint:http://localhost:9000}") String endpoint) {
        super("MinIO health check failed");
        this.endpoint = endpoint;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            restTemplate.getForEntity(endpoint + "/minio/health/live", String.class);
            builder.up().withDetail("endpoint", endpoint);
        } catch (Exception ex) {
            builder.down(ex).withDetail("endpoint", endpoint);
        }
    }
}
