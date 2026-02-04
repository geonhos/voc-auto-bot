package com.geonho.vocautobot.application.common.exception;

public class AuthenticationFailedException extends BusinessException {

    private static final int HTTP_UNAUTHORIZED = 401;

    public AuthenticationFailedException(String message) {
        super("AUTH_FAILED", message, HTTP_UNAUTHORIZED);
    }
}
