package com.geonho.vocautobot.application.email.port.in;

import com.geonho.vocautobot.application.email.port.in.dto.CreateTemplateCommand;
import com.geonho.vocautobot.domain.email.EmailTemplate;

/**
 * 이메일 템플릿 생성 UseCase 인터페이스
 */
public interface CreateTemplateUseCase {

    /**
     * 이메일 템플릿 생성
     *
     * @param command 템플릿 생성 커맨드
     * @return 생성된 이메일 템플릿
     */
    EmailTemplate createTemplate(CreateTemplateCommand command);

    /**
     * 이메일 템플릿 수정
     *
     * @param id 템플릿 ID
     * @param command 템플릿 수정 커맨드
     * @return 수정된 이메일 템플릿
     */
    EmailTemplate updateTemplate(Long id, CreateTemplateCommand command);

    /**
     * 이메일 템플릿 활성화
     *
     * @param id 템플릿 ID
     */
    void activateTemplate(Long id);

    /**
     * 이메일 템플릿 비활성화
     *
     * @param id 템플릿 ID
     */
    void deactivateTemplate(Long id);
}
