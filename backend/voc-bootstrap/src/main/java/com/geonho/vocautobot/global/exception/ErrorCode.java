package com.geonho.vocautobot.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "잘못된 요청입니다"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "유효성 검증에 실패했습니다"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 내부 오류가 발생했습니다"),

    // Authentication
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "인증이 필요합니다"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "토큰이 만료되었습니다"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "유효하지 않은 토큰입니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다"),
    ACCOUNT_LOCKED(HttpStatus.UNAUTHORIZED, "ACCOUNT_LOCKED", "계정이 잠겼습니다. 관리자에게 문의하세요"),
    ACCOUNT_INACTIVE(HttpStatus.UNAUTHORIZED, "ACCOUNT_INACTIVE", "비활성 계정입니다"),

    // Authorization
    FORBIDDEN(HttpStatus.FORBIDDEN, "FORBIDDEN", "접근 권한이 없습니다"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다"),
    USERNAME_DUPLICATE(HttpStatus.CONFLICT, "USERNAME_DUPLICATE", "이미 사용 중인 아이디입니다"),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "EMAIL_DUPLICATE", "이미 사용 중인 이메일입니다"),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH", "현재 비밀번호가 일치하지 않습니다"),
    INVALID_PASSWORD_FORMAT(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD_FORMAT", "비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야 합니다"),

    // VOC
    VOC_NOT_FOUND(HttpStatus.NOT_FOUND, "VOC_NOT_FOUND", "VOC를 찾을 수 없습니다"),
    INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION", "허용되지 않는 상태 전이입니다"),
    PROCESSING_NOTE_REQUIRED(HttpStatus.BAD_REQUEST, "PROCESSING_NOTE_REQUIRED", "처리 내용은 필수입니다"),
    REJECT_REASON_REQUIRED(HttpStatus.BAD_REQUEST, "REJECT_REASON_REQUIRED", "반려 사유는 필수입니다"),
    ALREADY_ASSIGNED(HttpStatus.CONFLICT, "ALREADY_ASSIGNED", "이미 담당자가 배정되어 있습니다"),

    // Attachment
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE", "파일 크기가 초과되었습니다 (최대 10MB)"),
    TOO_MANY_FILES(HttpStatus.BAD_REQUEST, "TOO_MANY_FILES", "첨부파일 개수가 초과되었습니다 (최대 5개)"),
    TOTAL_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "TOTAL_SIZE_EXCEEDED", "첨부파일 총 크기가 초과되었습니다 (최대 30MB)"),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE", "허용되지 않는 파일 형식입니다"),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "파일을 찾을 수 없습니다"),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"),
    CATEGORY_IN_USE(HttpStatus.CONFLICT, "CATEGORY_IN_USE", "사용 중인 카테고리는 삭제할 수 없습니다"),
    HAS_CHILDREN(HttpStatus.CONFLICT, "HAS_CHILDREN", "하위 카테고리가 있어 삭제할 수 없습니다"),
    PARENT_INACTIVE(HttpStatus.BAD_REQUEST, "PARENT_INACTIVE", "상위 카테고리가 비활성 상태입니다"),

    // Email
    TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND", "이메일 템플릿을 찾을 수 없습니다"),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_SEND_FAILED", "이메일 발송에 실패했습니다"),
    SYSTEM_TEMPLATE_DELETE(HttpStatus.FORBIDDEN, "SYSTEM_TEMPLATE_DELETE", "시스템 템플릿은 삭제할 수 없습니다"),

    // Rate Limiting
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "요청 제한을 초과했습니다. 잠시 후 다시 시도해 주세요"),

    // Analysis
    ANALYSIS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "ANALYSIS_FAILED", "AI 분석에 실패했습니다"),
    ANALYSIS_IN_PROGRESS(HttpStatus.CONFLICT, "ANALYSIS_IN_PROGRESS", "이미 분석이 진행 중입니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
