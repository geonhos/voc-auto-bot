package com.geonho.vocautobot.adapter.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Rate Limiting configuration for API protection.
 *
 * Configurable properties:
 * - rate-limiting.enabled: Enable/disable rate limiting (default: true)
 * - rate-limiting.requests-per-minute: Max requests per minute per client (default: 10)
 * - rate-limiting.fail-open: Allow requests when rate limiting fails (default: true)
 *
 * @see RateLimitFilter
 * @see RateLimitingFallbackConfig
 */
@Slf4j
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "rate-limiting")
public class RateLimitingConfig {

    /**
     * Enable or disable rate limiting.
     * When disabled, all requests pass through without rate limiting.
     */
    private boolean enabled = true;

    /**
     * Maximum number of requests allowed per minute per client (IP-based).
     * Default: 10 requests per minute as per FR-151 requirement.
     */
    private int requestsPerMinute = 10;

    /**
     * Fail-open policy: when true, requests are allowed if rate limiting fails.
     * When false, requests are denied if rate limiting fails (fail-closed).
     * Default: true (fail-open) - prioritizes availability over strict rate limiting.
     */
    private boolean failOpen = true;

    /**
     * Cache expiration time in minutes for rate limit buckets.
     * After this time, inactive client buckets are evicted from cache.
     */
    private int cacheExpirationMinutes = 5;

    /**
     * Creates a new rate limiting bucket with configured bandwidth.
     *
     * @return A new Bucket configured with the specified requests per minute
     */
    public Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(
                requestsPerMinute,
                Refill.greedy(requestsPerMinute, Duration.ofMinutes(1))
        );

        log.debug("Creating new rate limit bucket with {} requests per minute", requestsPerMinute);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Calculates the retry-after time in seconds when rate limit is exceeded.
     *
     * @param bucket The bucket to check for retry time
     * @return Seconds until the next token becomes available
     */
    public long calculateRetryAfterSeconds(Bucket bucket) {
        return bucket.getAvailableTokens() <= 0
                ? Duration.ofMinutes(1).toSeconds() / requestsPerMinute
                : 0;
    }
}
