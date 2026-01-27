package com.geonho.vocautobot.adapter.common.exception;

/**
 * Error code constants for API responses.
 */
public final class ErrorCodes {

    private ErrorCodes() {
        // Utility class
    }

    // Common errors
    public static final String INVALID_INPUT = "INVALID_INPUT";
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";
    public static final String INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";

    // Authentication errors
    public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    public static final String FORBIDDEN = "FORBIDDEN";
}
