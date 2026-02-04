package com.geonho.vocautobot.adapter.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplate configuration with proper timeout settings.
 *
 * <p>This configuration provides multiple RestTemplate beans for different use cases:</p>
 * <ul>
 *   <li>{@code restTemplate} - Default RestTemplate with standard timeouts (5s connect, 10s read)</li>
 *   <li>{@code aiAnalysisRestTemplate} - AI analysis specific RestTemplate with longer read timeout (30s)</li>
 * </ul>
 *
 * <p>Timeout Guidelines:</p>
 * <ul>
 *   <li>Connect Timeout: Time to establish connection (typically 5s)</li>
 *   <li>Read Timeout: Time to wait for response data (varies by use case)</li>
 * </ul>
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Default connect timeout in seconds.
     * Used for establishing TCP connection to the server.
     */
    private static final int DEFAULT_CONNECT_TIMEOUT_SECONDS = 5;

    /**
     * Default read timeout in seconds.
     * Used for waiting for response data from standard APIs.
     */
    private static final int DEFAULT_READ_TIMEOUT_SECONDS = 10;

    /**
     * AI analysis read timeout in seconds.
     * Longer timeout for AI/ML service calls which may take more time.
     */
    private static final int AI_ANALYSIS_READ_TIMEOUT_SECONDS = 30;

    /**
     * Default RestTemplate for general HTTP calls.
     *
     * <p>Configuration:</p>
     * <ul>
     *   <li>Connect Timeout: 5 seconds</li>
     *   <li>Read Timeout: 10 seconds</li>
     * </ul>
     *
     * @param builder RestTemplateBuilder provided by Spring Boot
     * @return configured RestTemplate
     */
    @Bean
    @Primary
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(DEFAULT_CONNECT_TIMEOUT_SECONDS))
                .setReadTimeout(Duration.ofSeconds(DEFAULT_READ_TIMEOUT_SECONDS))
                .build();
    }

    /**
     * RestTemplate specifically configured for AI analysis service calls.
     *
     * <p>This RestTemplate has a longer read timeout to accommodate
     * AI/ML processing which may take longer than typical API calls.</p>
     *
     * <p>Configuration:</p>
     * <ul>
     *   <li>Connect Timeout: 5 seconds</li>
     *   <li>Read Timeout: 30 seconds</li>
     * </ul>
     *
     * <p>Usage:</p>
     * <pre>
     * {@code
     * @Autowired
     * @Qualifier("aiAnalysisRestTemplate")
     * private RestTemplate aiRestTemplate;
     * }
     * </pre>
     *
     * @return configured RestTemplate for AI analysis
     */
    @Bean("aiAnalysisRestTemplate")
    public RestTemplate aiAnalysisRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(DEFAULT_CONNECT_TIMEOUT_SECONDS * 1000);  // milliseconds
        factory.setReadTimeout(AI_ANALYSIS_READ_TIMEOUT_SECONDS * 1000);    // milliseconds

        return new RestTemplate(factory);
    }

    /**
     * RestTemplate for external webhook/notification calls.
     *
     * <p>Configuration:</p>
     * <ul>
     *   <li>Connect Timeout: 5 seconds</li>
     *   <li>Read Timeout: 15 seconds</li>
     * </ul>
     *
     * @return configured RestTemplate for webhook calls
     */
    @Bean("webhookRestTemplate")
    public RestTemplate webhookRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(DEFAULT_CONNECT_TIMEOUT_SECONDS * 1000);  // milliseconds
        factory.setReadTimeout(15 * 1000);  // 15 seconds in milliseconds

        return new RestTemplate(factory);
    }
}
