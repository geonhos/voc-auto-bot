package com.geonho.vocautobot.adapter.in.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.config.RateLimitingConfig;
import com.geonho.vocautobot.adapter.config.RateLimitingFallbackConfig;
import com.geonho.vocautobot.application.audit.SecurityAuditPort;
import com.github.benmanes.caffeine.cache.Cache;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * HTTP request rate limiting filter using Bucket4j token bucket algorithm.
 *
 * Features:
 * - IP-based rate limiting (configurable requests per minute)
 * - Caffeine local cache for rate limit buckets (Redis fallback)
 * - Proper 429 Too Many Requests response with Retry-After header
 * - Configurable fail-open/fail-closed policy
 * - Skip rate limiting for certain paths (health checks, static resources)
 *
 * This filter is registered before JwtAuthenticationFilter in the security chain
 * to protect against brute force attacks before authentication processing.
 *
 * @see RateLimitingConfig
 * @see RateLimitingFallbackConfig
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String HEADER_X_REAL_IP = "X-Real-IP";
    private static final String HEADER_RETRY_AFTER = "Retry-After";
    private static final String HEADER_X_RATELIMIT_LIMIT = "X-RateLimit-Limit";
    private static final String HEADER_X_RATELIMIT_REMAINING = "X-RateLimit-Remaining";
    private static final String HEADER_X_RATELIMIT_RESET = "X-RateLimit-Reset";

    /**
     * Paths that should skip rate limiting.
     * These are typically health checks and static resources.
     */
    private static final List<String> SKIP_PATHS = List.of(
            "/actuator/health",
            "/actuator/info",
            "/swagger-ui/**",
            "/api-docs/**",
            "/v3/api-docs/**"
    );

    /**
     * Paths that should have rate limiting applied.
     * Only requests matching these patterns will be rate limited.
     */
    private static final List<String> RATE_LIMITED_PATHS = List.of(
            "/v1/auth/login",
            "/v1/auth/refresh",
            "/v1/vocs/**",
            "/v1/public/**"
    );

    private final RateLimitingConfig rateLimitingConfig;
    private final RateLimitingFallbackConfig fallbackConfig;
    private final Cache<String, Bucket> rateLimitBucketCache;
    private final ObjectMapper objectMapper;
    private final SecurityAuditPort securityAuditPort;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Skip if rate limiting is disabled
        if (!rateLimitingConfig.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestPath = request.getRequestURI();

        // Skip rate limiting for excluded paths
        if (shouldSkipRateLimiting(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only apply rate limiting to specific paths
        if (!shouldApplyRateLimiting(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = resolveClientKey(request);

        try {
            Bucket bucket = fallbackConfig.getOrCreateBucket(clientKey, rateLimitBucketCache);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            // Add rate limit headers to response
            addRateLimitHeaders(response, probe);

            if (probe.isConsumed()) {
                // Request allowed
                log.debug("Rate limit check passed for client: {}, remaining: {}",
                        clientKey, probe.getRemainingTokens());
                filterChain.doFilter(request, response);
            } else {
                // Rate limit exceeded
                long waitTimeSeconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
                log.warn("Rate limit exceeded for client: {}, path: {}, wait time: {}s",
                        clientKey, requestPath, waitTimeSeconds);

                // Security audit logging
                securityAuditPort.logRateLimitExceeded(clientKey, requestPath, waitTimeSeconds);

                sendRateLimitExceededResponse(response, waitTimeSeconds, clientKey);
            }
        } catch (Exception e) {
            // Handle rate limiting failure based on fail-open/fail-closed policy
            if (fallbackConfig.handleRateLimitFailure(clientKey, e)) {
                // Fail-open: allow request to proceed
                filterChain.doFilter(request, response);
            } else {
                // Fail-closed: deny request
                sendServiceUnavailableResponse(response);
            }
        }
    }

    /**
     * Resolves the client key (IP address) from the request.
     * Checks X-Forwarded-For and X-Real-IP headers for proxy scenarios.
     *
     * @param request The HTTP request
     * @return Client IP address for rate limiting key
     */
    private String resolveClientKey(HttpServletRequest request) {
        // Check X-Forwarded-For header (for reverse proxy)
        String xForwardedFor = request.getHeader(HEADER_X_FORWARDED_FOR);
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Take the first IP (original client)
            String clientIp = xForwardedFor.split(",")[0].trim();
            if (isValidIpAddress(clientIp)) {
                return clientIp;
            }
        }

        // Check X-Real-IP header
        String xRealIp = request.getHeader(HEADER_X_REAL_IP);
        if (xRealIp != null && !xRealIp.isBlank() && isValidIpAddress(xRealIp)) {
            return xRealIp;
        }

        // Fall back to remote address
        return request.getRemoteAddr();
    }

    /**
     * Validates that the IP address is in a valid format.
     * This helps prevent header spoofing attacks.
     *
     * @param ip The IP address to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        // Basic validation for IPv4 and IPv6
        // IPv4: 0-255.0-255.0-255.0-255
        // IPv6: contains colons
        return ip.matches("^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$") ||
                ip.contains(":");
    }

    /**
     * Checks if the request path should skip rate limiting.
     *
     * @param requestPath The request URI path
     * @return true if rate limiting should be skipped
     */
    private boolean shouldSkipRateLimiting(String requestPath) {
        return SKIP_PATHS.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
    }

    /**
     * Checks if the request path should have rate limiting applied.
     *
     * @param requestPath The request URI path
     * @return true if rate limiting should be applied
     */
    private boolean shouldApplyRateLimiting(String requestPath) {
        return RATE_LIMITED_PATHS.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
    }

    /**
     * Adds rate limit information headers to the response.
     *
     * @param response The HTTP response
     * @param probe    The consumption probe with rate limit info
     */
    private void addRateLimitHeaders(HttpServletResponse response, ConsumptionProbe probe) {
        response.setHeader(HEADER_X_RATELIMIT_LIMIT,
                String.valueOf(rateLimitingConfig.getRequestsPerMinute()));
        response.setHeader(HEADER_X_RATELIMIT_REMAINING,
                String.valueOf(Math.max(0, probe.getRemainingTokens())));
        response.setHeader(HEADER_X_RATELIMIT_RESET,
                String.valueOf(Instant.now().plusSeconds(60).getEpochSecond()));
    }

    /**
     * Sends a 429 Too Many Requests response when rate limit is exceeded.
     *
     * @param response        The HTTP response
     * @param retryAfterSeconds Seconds until the client can retry
     * @param clientKey       The client key for logging
     */
    private void sendRateLimitExceededResponse(HttpServletResponse response,
                                               long retryAfterSeconds,
                                               String clientKey) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HEADER_RETRY_AFTER, String.valueOf(Math.max(1, retryAfterSeconds)));

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorResponse.put("error", "Too Many Requests");
        errorResponse.put("message", "Rate limit exceeded. Please try again later.");
        errorResponse.put("retryAfter", Math.max(1, retryAfterSeconds));
        errorResponse.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    /**
     * Sends a 503 Service Unavailable response when rate limiting fails
     * and fail-closed policy is configured.
     *
     * @param response The HTTP response
     */
    private void sendServiceUnavailableResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        errorResponse.put("error", "Service Unavailable");
        errorResponse.put("message", "Service temporarily unavailable. Please try again later.");
        errorResponse.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
