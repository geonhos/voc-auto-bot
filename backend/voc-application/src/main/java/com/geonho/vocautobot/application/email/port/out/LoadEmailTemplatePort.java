package com.geonho.vocautobot.application.email.port.out;

import com.geonho.vocautobot.domain.email.EmailTemplate;

import java.util.List;
import java.util.Optional;

/**
 * 이메일 템플릿 조회 Port 인터페이스
 */
public interface LoadEmailTemplatePort {

    /**
     * ID로 이메일 템플릿 조회
     *
     * @param id 템플릿 ID
     * @return 이메일 템플릿
     */
    Optional<EmailTemplate> loadTemplateById(Long id);

    /**
     * 이름으로 이메일 템플릿 조회
     *
     * @param name 템플릿 이름
     * @return 이메일 템플릿
     */
    Optional<EmailTemplate> loadTemplateByName(String name);

    /**
     * 활성화된 이메일 템플릿 목록 조회
     *
     * @return 활성화된 템플릿 목록
     */
    List<EmailTemplate> loadActiveTemplates();

    /**
     * 모든 이메일 템플릿 조회
     *
     * @return 모든 템플릿 목록
     */
    List<EmailTemplate> loadAllTemplates();

    /**
     * 템플릿 이름 존재 여부 확인
     *
     * @param name 템플릿 이름
     * @return 존재 여부
     */
    boolean existsByName(String name);
}
