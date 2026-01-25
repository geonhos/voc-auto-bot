package com.geonho.vocautobot.application.common.exception;

public class AuthenticationFailedException extends BusinessException {

    public AuthenticationFailedException(String message) {
        super("AUTH_FAILED", message);
    }
}
