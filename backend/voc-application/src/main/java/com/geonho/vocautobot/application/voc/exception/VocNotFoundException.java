package com.geonho.vocautobot.application.voc.exception;

import com.geonho.vocautobot.application.common.exception.BusinessException;

/**
 * Exception thrown when a VOC is not found
 */
public class VocNotFoundException extends BusinessException {

    public VocNotFoundException(Long vocId) {
        super("VOC를 찾을 수 없습니다. ID: " + vocId);
    }

    public VocNotFoundException(String ticketId) {
        super("VOC를 찾을 수 없습니다. 티켓번호: " + ticketId);
    }
}
