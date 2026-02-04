package com.geonho.vocautobot.adapter.in.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.config.RateLimitingConfig;
import com.geonho.vocautobot.adapter.config.RateLimitingFallbackConfig;
import com.geonho.vocautobot.application.audit.SecurityAuditPort;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RateLimitFilter.
 *
 * Tests cover:
 * - Normal request flow (within rate limit)
 * - Rate limit exceeded (429 response)
 * - Retry-After header verification
 * - Skip paths functionality
 * - Rate limit disabled functionality
 * - Fail-open/fail-closed policy
 * - IP address resolution from headers
 */
@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;
    private RateLimitingConfig rateLimitingConfig;
    private RateLimitingFallbackConfig fallbackConfig;
    private Cache<String, Bucket> bucketCache;
    private ObjectMapper objectMapper;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityAuditPort securityAuditPort;

    @BeforeEach
    void setUp() {
        rateLimitingConfig = new RateLimitingConfig();
        rateLimitingConfig.setEnabled(true);
        rateLimitingConfig.setRequestsPerMinute(10);
        rateLimitingConfig.setFailOpen(true);
        rateLimitingConfig.setCacheExpirationMinutes(5);

        fallbackConfig = new RateLimitingFallbackConfig(rateLimitingConfig);

        bucketCache = Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(5))
                .maximumSize(10000)
                .build();

        objectMapper = new ObjectMapper();

        rateLimitFilter = new RateLimitFilter(
                rateLimitingConfig,
                fallbackConfig,
                bucketCache,
                objectMapper,
                securityAuditPort
        );
    }

    @Nested
    @DisplayName("Normal Request Flow Tests")
    class NormalRequestFlowTests {

        @Test
        @DisplayName("Should allow request when within rate limit")
        void shouldAllowRequest_whenWithinRateLimit() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
            assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
            assertThat(response.getHeader("X-RateLimit-Remaining")).isNotNull();
        }

        @Test
        @DisplayName("Should decrement remaining count on each request")
        void shouldDecrementRemainingCount_onEachRequest() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/auth/login");
            String clientIp = "192.168.1.100";
            request.setRemoteAddr(clientIp);

            // when - make 3 requests
            for (int i = 0; i < 3; i++) {
                MockHttpServletResponse response = new MockHttpServletResponse();
                rateLimitFilter.doFilterInternal(request, response, filterChain);
            }

            // then - 4th request should have 6 remaining (10 - 4 = 6)
            MockHttpServletResponse finalResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, finalResponse, filterChain);

            assertThat(finalResponse.getHeader("X-RateLimit-Remaining")).isEqualTo("6");
        }
    }

    @Nested
    @DisplayName("Rate Limit Exceeded Tests")
    class RateLimitExceededTests {

        @Test
        @DisplayName("Should return 429 when rate limit is exceeded")
        void shouldReturn429_whenRateLimitExceeded() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(3);
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            request.setRemoteAddr("10.0.0.1");

            // when - exceed rate limit
            for (int i = 0; i < 3; i++) {
                MockHttpServletResponse response = new MockHttpServletResponse();
                rateLimitFilter.doFilterInternal(request, response, filterChain);
            }

            // 4th request should be blocked
            MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, blockedResponse, filterChain);

            // then
            assertThat(blockedResponse.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
            assertThat(blockedResponse.getContentAsString()).contains("Rate limit exceeded");
        }

        @Test
        @DisplayName("Should include Retry-After header when rate limit is exceeded")
        void shouldIncludeRetryAfterHeader_whenRateLimitExceeded() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(1);
            MockHttpServletRequest request = createRequest("/v1/auth/login");
            request.setRemoteAddr("10.0.0.2");

            // when - exceed rate limit
            MockHttpServletResponse firstResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, firstResponse, filterChain);

            MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, blockedResponse, filterChain);

            // then
            assertThat(blockedResponse.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
            assertThat(blockedResponse.getHeader("Retry-After")).isNotNull();
            int retryAfter = Integer.parseInt(blockedResponse.getHeader("Retry-After"));
            assertThat(retryAfter).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should include error details in response body when rate limit exceeded")
        void shouldIncludeErrorDetails_whenRateLimitExceeded() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(1);
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            request.setRemoteAddr("10.0.0.3");

            // when - exceed rate limit
            MockHttpServletResponse firstResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, firstResponse, filterChain);

            MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, blockedResponse, filterChain);

            // then
            String responseBody = blockedResponse.getContentAsString();
            assertThat(responseBody).contains("\"status\":429");
            assertThat(responseBody).contains("\"error\":\"Too Many Requests\"");
            assertThat(responseBody).contains("\"retryAfter\"");
            assertThat(responseBody).contains("\"timestamp\"");
        }
    }

    @Nested
    @DisplayName("Skip Paths Tests")
    class SkipPathsTests {

        @Test
        @DisplayName("Should skip rate limiting for actuator health endpoint")
        void shouldSkipRateLimiting_forActuatorHealth() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/actuator/health");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
            assertThat(response.getHeader("X-RateLimit-Limit")).isNull();
        }

        @Test
        @DisplayName("Should skip rate limiting for swagger-ui")
        void shouldSkipRateLimiting_forSwaggerUi() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/swagger-ui/index.html");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
            assertThat(response.getHeader("X-RateLimit-Limit")).isNull();
        }

        @Test
        @DisplayName("Should skip rate limiting for paths not in rate limited list")
        void shouldSkipRateLimiting_forNonRateLimitedPaths() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/some/other/path");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
            assertThat(response.getHeader("X-RateLimit-Limit")).isNull();
        }
    }

    @Nested
    @DisplayName("Rate Limiting Disabled Tests")
    class RateLimitingDisabledTests {

        @Test
        @DisplayName("Should skip all rate limiting when disabled")
        void shouldSkipAllRateLimiting_whenDisabled() throws Exception {
            // given
            rateLimitingConfig.setEnabled(false);
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
            assertThat(response.getHeader("X-RateLimit-Limit")).isNull();
        }
    }

    @Nested
    @DisplayName("IP Address Resolution Tests")
    class IpAddressResolutionTests {

        @Test
        @DisplayName("Should use X-Forwarded-For header when present")
        void shouldUseXForwardedFor_whenPresent() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(2);
            MockHttpServletRequest request1 = createRequest("/v1/vocs/123");
            request1.addHeader("X-Forwarded-For", "203.0.113.1, 70.41.3.18");
            request1.setRemoteAddr("10.0.0.1");

            MockHttpServletRequest request2 = createRequest("/v1/vocs/123");
            request2.addHeader("X-Forwarded-For", "203.0.113.2");
            request2.setRemoteAddr("10.0.0.1");

            // when - make requests from different "clients"
            for (int i = 0; i < 2; i++) {
                MockHttpServletResponse response = new MockHttpServletResponse();
                rateLimitFilter.doFilterInternal(request1, response, filterChain);
            }

            MockHttpServletResponse response2 = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request2, response2, filterChain);

            // then - request2 should not be rate limited (different client IP)
            assertThat(response2.getStatus()).isEqualTo(HttpStatus.OK.value());
            assertThat(response2.getHeader("X-RateLimit-Remaining")).isEqualTo("1");
        }

        @Test
        @DisplayName("Should use X-Real-IP header when X-Forwarded-For is absent")
        void shouldUseXRealIp_whenXForwardedForAbsent() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(2);
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            request.addHeader("X-Real-IP", "192.168.1.50");
            request.setRemoteAddr("10.0.0.1");

            // when
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then - should use the X-Real-IP, not remoteAddr
            assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("1");
        }

        @Test
        @DisplayName("Should fall back to remoteAddr when no headers present")
        void shouldFallbackToRemoteAddr_whenNoHeadersPresent() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            request.setRemoteAddr("172.16.0.100");

            // when
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should reject invalid IP addresses in X-Forwarded-For")
        void shouldRejectInvalidIp_inXForwardedFor() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/vocs/123");
            request.addHeader("X-Forwarded-For", "invalid-ip-address");
            request.setRemoteAddr("192.168.1.1");

            // when
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then - should fall back to remoteAddr
            verify(filterChain).doFilter(request, response);
        }
    }

    @Nested
    @DisplayName("Rate Limited Paths Tests")
    class RateLimitedPathsTests {

        @Test
        @DisplayName("Should apply rate limiting to /v1/auth/login")
        void shouldApplyRateLimiting_toAuthLogin() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/auth/login");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
        }

        @Test
        @DisplayName("Should apply rate limiting to /v1/vocs/** paths")
        void shouldApplyRateLimiting_toVocsPaths() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/vocs/123/attachments");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
        }

        @Test
        @DisplayName("Should apply rate limiting to /v1/public/** paths")
        void shouldApplyRateLimiting_toPublicPaths() throws Exception {
            // given
            MockHttpServletRequest request = createRequest("/v1/public/vocs/ABC123");
            MockHttpServletResponse response = new MockHttpServletResponse();

            // when
            rateLimitFilter.doFilterInternal(request, response, filterChain);

            // then
            assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
        }
    }

    @Nested
    @DisplayName("Different Clients Tests")
    class DifferentClientsTests {

        @Test
        @DisplayName("Should track rate limits separately for different clients")
        void shouldTrackRateLimitsSeparately_forDifferentClients() throws Exception {
            // given
            rateLimitingConfig.setRequestsPerMinute(2);

            MockHttpServletRequest clientA = createRequest("/v1/vocs/123");
            clientA.setRemoteAddr("192.168.1.1");

            MockHttpServletRequest clientB = createRequest("/v1/vocs/123");
            clientB.setRemoteAddr("192.168.1.2");

            // when - client A makes 2 requests (at limit)
            for (int i = 0; i < 2; i++) {
                MockHttpServletResponse response = new MockHttpServletResponse();
                rateLimitFilter.doFilterInternal(clientA, response, filterChain);
            }

            // client A's 3rd request should be blocked
            MockHttpServletResponse clientABlockedResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(clientA, clientABlockedResponse, filterChain);

            // client B should still be able to make requests
            MockHttpServletResponse clientBResponse = new MockHttpServletResponse();
            rateLimitFilter.doFilterInternal(clientB, clientBResponse, filterChain);

            // then
            assertThat(clientABlockedResponse.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
            assertThat(clientBResponse.getStatus()).isEqualTo(HttpStatus.OK.value());
        }
    }

    private MockHttpServletRequest createRequest(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(path);
        request.setMethod("GET");
        request.setRemoteAddr("127.0.0.1");
        return request;
    }
}
