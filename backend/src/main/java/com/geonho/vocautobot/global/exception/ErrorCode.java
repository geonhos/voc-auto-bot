package com.geonho.vocautobot.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "C002", "리소스를 찾을 수 없습니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C003", "서버 내부 오류가 발생했습니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C004", "허용되지 않은 HTTP 메서드입니다"),

    // Authentication
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A001", "인증이 필요합니다"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A002", "유효하지 않은 토큰입니다"),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "만료된 토큰입니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A004", "이메일 또는 비밀번호가 올바르지 않습니다"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A005", "접근 권한이 없습니다"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다"),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "U002", "이미 사용 중인 이메일입니다"),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U003", "비밀번호 형식이 올바르지 않습니다"),

    // VOC
    VOC_NOT_FOUND(HttpStatus.NOT_FOUND, "V001", "VOC를 찾을 수 없습니다"),
    VOC_ALREADY_ASSIGNED(HttpStatus.CONFLICT, "V002", "이미 담당자가 배정되어 있습니다"),
    VOC_STATUS_CANNOT_CHANGE(HttpStatus.BAD_REQUEST, "V003", "현재 상태에서 변경할 수 없습니다"),
    VOC_DRAFT_NOT_FOUND(HttpStatus.NOT_FOUND, "V004", "임시 저장된 VOC를 찾을 수 없습니다"),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CT001", "카테고리를 찾을 수 없습니다"),
    CATEGORY_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "CT002", "이미 존재하는 카테고리명입니다"),
    CATEGORY_HAS_CHILDREN(HttpStatus.BAD_REQUEST, "CT003", "하위 카테고리가 존재합니다"),
    CATEGORY_IN_USE(HttpStatus.BAD_REQUEST, "CT004", "사용 중인 카테고리는 삭제할 수 없습니다"),

    // Email
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "E001", "이메일 발송에 실패했습니다"),
    EMAIL_TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "E002", "이메일 템플릿을 찾을 수 없습니다");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
