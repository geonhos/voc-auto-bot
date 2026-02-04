package com.geonho.vocautobot.application.audit;

/**
 * Port interface for security audit logging.
 *
 * <p>This interface defines the contract for security event logging,
 * allowing different implementations (e.g., file-based, database, external service).
 */
public interface SecurityAuditPort {

    /**
     * Logs a successful login event.
     *
     * @param username the username that logged in
     * @param userId   the user ID
     * @param ipAddress the client IP address
     */
    void logLoginSuccess(String username, Long userId, String ipAddress);

    /**
     * Logs a failed login attempt.
     *
     * @param username   the attempted username
     * @param ipAddress  the client IP address
     * @param reason     the failure reason
     */
    void logLoginFailure(String username, String ipAddress, String reason);

    /**
     * Logs a failed login attempt with failure count.
     *
     * @param username     the attempted username
     * @param ipAddress    the client IP address
     * @param reason       the failure reason
     * @param failureCount the number of consecutive failures
     */
    void logLoginFailure(String username, String ipAddress, String reason, int failureCount);

    /**
     * Logs an account lockout event.
     *
     * @param username  the username that was locked
     * @param userId    the user ID
     * @param ipAddress the client IP address
     */
    void logAccountLocked(String username, Long userId, String ipAddress);

    /**
     * Logs when rate limit is exceeded.
     *
     * @param clientKey     the client identifier (IP address)
     * @param requestPath   the requested path
     * @param retryAfterSec seconds until retry is allowed
     */
    void logRateLimitExceeded(String clientKey, String requestPath, long retryAfterSec);

    /**
     * Logs suspicious activity detection.
     *
     * @param activityType the type of suspicious activity
     * @param details      additional details
     * @param ipAddress    the client IP address
     */
    void logSuspiciousActivity(String activityType, String details, String ipAddress);
}
