package com.geonho.vocautobot.domain.user;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * User domain entity representing a system user.
 *
 * <h3>State Mutation Pattern</h3>
 * <p>
 * This entity follows a controlled mutability pattern where state changes are only allowed
 * through explicit behavior methods. Direct field modification is not supported.
 * </p>
 *
 * <h4>State Change Methods:</h4>
 * <ul>
 *   <li>{@link #updateProfile(String, String)} - Updates name and email</li>
 *   <li>{@link #changePassword(String)} - Changes the password (should be pre-encoded)</li>
 *   <li>{@link #changeRole(UserRole)} - Changes the user role</li>
 *   <li>{@link #activate()} / {@link #deactivate()} - Controls account active status</li>
 *   <li>{@link #lock()} / {@link #unlock()} - Controls account lock status</li>
 *   <li>{@link #recordLoginSuccess()} - Records successful login (resets failure count)</li>
 *   <li>{@link #recordLoginFailure()} - Records failed login (may trigger auto-lock)</li>
 * </ul>
 *
 * <h4>Auto-Lock Policy:</h4>
 * <p>
 * The account is automatically locked after 5 consecutive failed login attempts.
 * This is handled internally by {@link #recordLoginFailure()}.
 * </p>
 *
 * <h4>Thread Safety:</h4>
 * <p>
 * This class is NOT thread-safe. Concurrent modifications should be handled
 * at the service/repository layer using proper locking mechanisms.
 * </p>
 *
 * @see UserRole
 */
@Getter
@Builder
public class User {

    private Long id;
    private String username;
    private String password;
    private String name;
    private String email;
    private UserRole role;
    private boolean isActive;
    private boolean isLocked;
    private int failedLoginAttempts;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;

    /**
     * Updates the user's profile information.
     *
     * @param name  the new display name
     * @param email the new email address
     */
    public void updateProfile(String name, String email) {
        this.name = name;
        this.email = email;
    }

    /**
     * Changes the user's password.
     * Note: The password should already be encoded before calling this method.
     *
     * @param newPassword the new encoded password
     */
    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    /**
     * Changes the user's role.
     *
     * @param newRole the new role to assign
     */
    public void changeRole(UserRole newRole) {
        this.role = newRole;
    }

    /**
     * Activates the user account, allowing login.
     */
    public void activate() {
        this.isActive = true;
    }

    /**
     * Deactivates the user account, preventing login.
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * Locks the user account, preventing login.
     * This is typically called automatically after too many failed login attempts.
     */
    public void lock() {
        this.isLocked = true;
    }

    /**
     * Unlocks the user account and resets the failed login counter.
     * This should only be called by an administrator.
     */
    public void unlock() {
        this.isLocked = false;
        this.failedLoginAttempts = 0;
    }

    /**
     * Records a successful login attempt.
     * Resets the failed login counter and updates the last login timestamp.
     */
    public void recordLoginSuccess() {
        this.failedLoginAttempts = 0;
        this.lastLoginAt = LocalDateTime.now();
    }

    /**
     * Records a failed login attempt.
     * Increments the failure counter and automatically locks the account
     * if the maximum number of attempts ({@value #MAX_FAILED_LOGIN_ATTEMPTS}) is reached.
     */
    public void recordLoginFailure() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            this.lock();
        }
    }

    /**
     * Checks if the user can currently log in.
     *
     * @return true if the account is active and not locked
     */
    public boolean canLogin() {
        return isActive && !isLocked;
    }
}
