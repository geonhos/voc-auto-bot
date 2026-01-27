package com.geonho.vocautobot.application.email.port.out;

import com.geonho.vocautobot.domain.email.EmailTemplate;

/**
 * 이메일 템플릿 저장 Port 인터페이스
 */
public interface SaveEmailTemplatePort {

    /**
     * 이메일 템플릿 저장
     *
     * @param template 이메일 템플릿
     * @return 저장된 이메일 템플릿
     */
    EmailTemplate saveEmailTemplate(EmailTemplate template);

    /**
     * 이메일 템플릿 삭제
     *
     * @param id 템플릿 ID
     */
    void deleteEmailTemplate(Long id);
}
