package com.geonho.vocautobot.adapter.out.ai.exception;

/**
 * Exception thrown when LLM integration fails
 */
public class LlmIntegrationException extends RuntimeException {

    private final ErrorType errorType;

    public enum ErrorType {
        NETWORK_ERROR("네트워크 오류"),
        TIMEOUT("타임아웃"),
        PARSING_ERROR("응답 파싱 오류"),
        INVALID_RESPONSE("유효하지 않은 응답");

        private final String description;

        ErrorType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public LlmIntegrationException(ErrorType errorType, String message) {
        super(errorType.getDescription() + ": " + message);
        this.errorType = errorType;
    }

    public LlmIntegrationException(ErrorType errorType, String message, Throwable cause) {
        super(errorType.getDescription() + ": " + message, cause);
        this.errorType = errorType;
    }

    public ErrorType getErrorType() {
        return errorType;
    }
}
