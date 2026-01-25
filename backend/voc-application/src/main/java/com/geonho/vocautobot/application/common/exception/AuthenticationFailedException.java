package com.geonho.vocautobot.application.common.exception;

import lombok.Getter;

@Getter
public class AuthenticationFailedException extends RuntimeException {

    private final String errorCode;

    public AuthenticationFailedException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
