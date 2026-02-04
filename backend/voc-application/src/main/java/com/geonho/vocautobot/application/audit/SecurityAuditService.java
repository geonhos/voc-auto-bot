package com.geonho.vocautobot.application.audit;

import com.geonho.vocautobot.application.common.UseCase;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for logging security-related events.
 *
 * <p>This service provides a centralized location for security audit logging,
 * making it easier to:
 * <ul>
 *   <li>Monitor authentication attempts</li>
 *   <li>Detect potential brute force attacks</li>
 *   <li>Comply with security audit requirements</li>
 *   <li>Integrate with SIEM systems</li>
 * </ul>
 *
 * <p>Log Format: Each log entry contains a structured format that can be parsed
 * by log aggregation systems (ELK, Splunk, etc.)
 *
 * <p>Future Enhancements:
 * <ul>
 *   <li>Database persistence for long-term retention</li>
 *   <li>Real-time alerting for suspicious activity</li>
 *   <li>Integration with external security monitoring</li>
 * </ul>
 */
@Slf4j
@UseCase
public class SecurityAuditService implements SecurityAuditPort {

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Logs a successful login event.
     *
     * @param username the username that logged in
     * @param userId   the user ID
     * @param ipAddress the client IP address
     */
    public void logLoginSuccess(String username, Long userId, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.info("[SECURITY_AUDIT] event=LOGIN_SUCCESS, timestamp={}, username={}, userId={}, ip={}",
                timestamp, maskUsername(username), userId, ipAddress);
    }

    /**
     * Logs a failed login attempt.
     *
     * @param username   the attempted username
     * @param ipAddress  the client IP address
     * @param reason     the failure reason
     */
    public void logLoginFailure(String username, String ipAddress, String reason) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.warn("[SECURITY_AUDIT] event=LOGIN_FAILURE, timestamp={}, username={}, ip={}, reason={}",
                timestamp, maskUsername(username), ipAddress, reason);
    }

    /**
     * Logs a failed login attempt with failure count.
     *
     * @param username     the attempted username
     * @param ipAddress    the client IP address
     * @param reason       the failure reason
     * @param failureCount the number of consecutive failures
     */
    public void logLoginFailure(String username, String ipAddress, String reason, int failureCount) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.warn("[SECURITY_AUDIT] event=LOGIN_FAILURE, timestamp={}, username={}, ip={}, reason={}, failureCount={}",
                timestamp, maskUsername(username), ipAddress, reason, failureCount);

        // Alert on high failure count
        if (failureCount >= 5) {
            log.error("[SECURITY_ALERT] Possible brute force attack detected: username={}, ip={}, failureCount={}",
                    maskUsername(username), ipAddress, failureCount);
        }
    }

    /**
     * Logs an account lockout event.
     *
     * @param username  the username that was locked
     * @param userId    the user ID
     * @param ipAddress the client IP address
     */
    public void logAccountLocked(String username, Long userId, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.error("[SECURITY_AUDIT] event=ACCOUNT_LOCKED, timestamp={}, username={}, userId={}, ip={}",
                timestamp, maskUsername(username), userId, ipAddress);
    }

    /**
     * Logs when rate limit is exceeded.
     *
     * @param clientKey     the client identifier (IP address)
     * @param requestPath   the requested path
     * @param retryAfterSec seconds until retry is allowed
     */
    public void logRateLimitExceeded(String clientKey, String requestPath, long retryAfterSec) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.warn("[SECURITY_AUDIT] event=RATE_LIMIT_EXCEEDED, timestamp={}, clientKey={}, path={}, retryAfterSeconds={}",
                timestamp, clientKey, requestPath, retryAfterSec);
    }

    /**
     * Logs suspicious activity detection.
     *
     * @param activityType the type of suspicious activity
     * @param details      additional details
     * @param ipAddress    the client IP address
     */
    public void logSuspiciousActivity(String activityType, String details, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.error("[SECURITY_AUDIT] event=SUSPICIOUS_ACTIVITY, timestamp={}, type={}, details={}, ip={}",
                timestamp, activityType, details, ipAddress);
    }

    /**
     * Logs token refresh events.
     *
     * @param username  the username
     * @param ipAddress the client IP address
     */
    public void logTokenRefresh(String username, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.info("[SECURITY_AUDIT] event=TOKEN_REFRESH, timestamp={}, username={}, ip={}",
                timestamp, maskUsername(username), ipAddress);
    }

    /**
     * Logs logout events.
     *
     * @param username  the username
     * @param userId    the user ID
     * @param ipAddress the client IP address
     */
    public void logLogout(String username, Long userId, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.info("[SECURITY_AUDIT] event=LOGOUT, timestamp={}, username={}, userId={}, ip={}",
                timestamp, maskUsername(username), userId, ipAddress);
    }

    /**
     * Logs access denied events.
     *
     * @param username    the username (may be null for unauthenticated)
     * @param resource    the resource that was denied
     * @param ipAddress   the client IP address
     */
    public void logAccessDenied(String username, String resource, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.warn("[SECURITY_AUDIT] event=ACCESS_DENIED, timestamp={}, username={}, resource={}, ip={}",
                timestamp, username != null ? maskUsername(username) : "anonymous", resource, ipAddress);
    }

    /**
     * Masks username for privacy in logs (shows first 2 and last 2 characters).
     *
     * @param username the full username
     * @return masked username
     */
    private String maskUsername(String username) {
        if (username == null || username.length() <= 4) {
            return "***";
        }
        return username.substring(0, 2) + "***" + username.substring(username.length() - 2);
    }
}
