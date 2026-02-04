package com.geonho.vocautobot.application.auth.port.in.dto;

/**
 * Command for user login.
 *
 * @param email    the user's email address
 * @param password the user's password
 * @param clientIp the client's IP address for security audit logging (optional)
 */
public record LoginCommand(
        String email,
        String password,
        String clientIp
) {
    /**
     * Creates a LoginCommand without client IP.
     * Used for backward compatibility.
     *
     * @param email    the user's email
     * @param password the user's password
     */
    public LoginCommand(String email, String password) {
        this(email, password, null);
    }
}
