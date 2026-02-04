package com.geonho.vocautobot.adapter.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Fallback configuration for Rate Limiting using Caffeine local cache.
 *
 * This configuration provides:
 * - Local in-memory rate limiting when Redis is unavailable
 * - Automatic detection of Redis connection failures
 * - Fail-open policy support (requests allowed during failures with warning logs)
 * - Automatic recovery when Redis becomes available
 *
 * Note: Local cache is not distributed, so each application instance maintains
 * its own rate limit counters. This is acceptable for local development and
 * as a fallback mechanism, but production deployments should use Redis.
 *
 * @see RateLimitingConfig
 * @see RateLimitFilter
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class RateLimitingFallbackConfig {

    private final RateLimitingConfig rateLimitingConfig;

    /**
     * Thread-safe flag to track if we're currently in fallback mode.
     * Used to reduce log spam when repeatedly in fallback state.
     */
    private final AtomicBoolean inFallbackMode = new AtomicBoolean(false);

    /**
     * Creates a Caffeine cache for storing rate limit buckets per client.
     *
     * The cache is configured with:
     * - Time-based expiration to clean up inactive clients
     * - Maximum size to prevent memory exhaustion
     * - Removal listener for logging
     *
     * @return Caffeine cache for rate limiting buckets
     */
    @Bean
    public Cache<String, Bucket> rateLimitBucketCache() {
        int expirationMinutes = rateLimitingConfig.getCacheExpirationMinutes();

        log.info("Initializing rate limit bucket cache with {}min expiration", expirationMinutes);

        return Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(expirationMinutes))
                .maximumSize(10000) // Maximum 10,000 unique clients
                .recordStats() // Enable statistics for monitoring
                .removalListener((key, value, cause) ->
                        log.debug("Rate limit bucket removed for key: {}, cause: {}", key, cause))
                .build();
    }

    /**
     * Gets or creates a rate limit bucket for the given client key.
     *
     * @param clientKey Unique identifier for the client (typically IP address)
     * @param cache     The Caffeine cache to use
     * @return The rate limit bucket for this client
     */
    public Bucket getOrCreateBucket(String clientKey, Cache<String, Bucket> cache) {
        return cache.get(clientKey, key -> {
            log.debug("Creating new rate limit bucket for client: {}", key);
            return rateLimitingConfig.createNewBucket();
        });
    }

    /**
     * Called when entering fallback mode (e.g., Redis connection failed).
     * Logs a warning on first entry, then suppresses repeated warnings.
     *
     * @param reason The reason for entering fallback mode
     */
    public void enterFallbackMode(String reason) {
        if (inFallbackMode.compareAndSet(false, true)) {
            log.warn("Rate limiting entering fallback mode: {}. " +
                    "Using local Caffeine cache instead of distributed storage.", reason);
        }
    }

    /**
     * Called when exiting fallback mode (e.g., Redis connection restored).
     * Logs recovery information.
     */
    public void exitFallbackMode() {
        if (inFallbackMode.compareAndSet(true, false)) {
            log.info("Rate limiting exiting fallback mode. " +
                    "Distributed rate limiting restored.");
        }
    }

    /**
     * Checks if currently in fallback mode.
     *
     * @return true if in fallback mode, false otherwise
     */
    public boolean isInFallbackMode() {
        return inFallbackMode.get();
    }

    /**
     * Handles the case when rate limiting completely fails.
     * Based on fail-open configuration, either allows the request with a warning
     * or denies the request.
     *
     * @param clientKey The client key that triggered the failure
     * @param exception The exception that caused the failure
     * @return true if request should be allowed (fail-open), false otherwise
     */
    public boolean handleRateLimitFailure(String clientKey, Exception exception) {
        if (rateLimitingConfig.isFailOpen()) {
            log.warn("Rate limiting failed for client: {}. " +
                            "Allowing request due to fail-open policy. Error: {}",
                    clientKey, exception.getMessage());
            return true; // Allow request
        } else {
            log.error("Rate limiting failed for client: {}. " +
                            "Denying request due to fail-closed policy. Error: {}",
                    clientKey, exception.getMessage());
            return false; // Deny request
        }
    }
}
