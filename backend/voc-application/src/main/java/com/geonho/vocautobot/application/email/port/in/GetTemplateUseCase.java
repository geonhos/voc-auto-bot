package com.geonho.vocautobot.application.email.port.in;

import com.geonho.vocautobot.domain.email.EmailTemplate;

import java.util.List;

/**
 * 이메일 템플릿 조회 UseCase 인터페이스
 */
public interface GetTemplateUseCase {

    /**
     * ID로 이메일 템플릿 조회
     */
    EmailTemplate getTemplateById(Long id);

    /**
     * 활성화된 이메일 템플릿 목록 조회
     */
    List<EmailTemplate> getActiveTemplates();

    /**
     * 모든 이메일 템플릿 조회
     */
    List<EmailTemplate> getAllTemplates();
}
