package com.geonho.vocautobot.application.common.exception;

public class EntityNotFoundException extends BusinessException {

    public EntityNotFoundException(String message) {
        super("ENTITY_NOT_FOUND", message);
    }

    public EntityNotFoundException(String entityName, Long id) {
        super("ENTITY_NOT_FOUND", entityName + "을(를) 찾을 수 없습니다. ID: " + id);
    }
}
