package com.geonho.vocautobot.application.voc.exception;

import com.geonho.vocautobot.application.common.exception.BusinessException;

/**
 * Exception thrown when a user attempts to access a VOC without proper authorization
 */
public class VocAccessDeniedException extends BusinessException {

    private static final String ERROR_CODE = "VOC_ACCESS_DENIED";
    private static final int HTTP_STATUS = 403;

    public VocAccessDeniedException(Long vocId, Long userId) {
        super(
                ERROR_CODE,
                String.format("사용자(ID: %d)는 VOC(ID: %d)에 대한 접근 권한이 없습니다.", userId, vocId),
                HTTP_STATUS
        );
    }

    public VocAccessDeniedException(String message) {
        super(ERROR_CODE, message, HTTP_STATUS);
    }
}
