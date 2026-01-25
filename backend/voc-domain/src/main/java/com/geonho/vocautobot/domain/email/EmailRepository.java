package com.geonho.vocautobot.domain.email;

import java.util.List;
import java.util.Optional;

/**
 * 이메일 관련 도메인 Repository 인터페이스
 */
public interface EmailRepository {

    /**
     * 이메일 템플릿 저장
     */
    EmailTemplate saveTemplate(EmailTemplate template);

    /**
     * 이메일 템플릿 ID로 조회
     */
    Optional<EmailTemplate> findTemplateById(Long id);

    /**
     * 활성화된 이메일 템플릿 목록 조회
     */
    List<EmailTemplate> findActiveTemplates();

    /**
     * 모든 이메일 템플릿 조회
     */
    List<EmailTemplate> findAllTemplates();

    /**
     * 이메일 템플릿 삭제
     */
    void deleteTemplate(Long id);

    /**
     * 이메일 로그 저장
     */
    EmailLog saveLog(EmailLog log);

    /**
     * 이메일 로그 ID로 조회
     */
    Optional<EmailLog> findLogById(Long id);

    /**
     * 템플릿 ID로 이메일 로그 목록 조회
     */
    List<EmailLog> findLogsByTemplateId(Long templateId);

    /**
     * 수신자 이메일로 이메일 로그 목록 조회
     */
    List<EmailLog> findLogsByRecipientEmail(String recipientEmail);

    /**
     * 상태별 이메일 로그 목록 조회
     */
    List<EmailLog> findLogsByStatus(EmailStatus status);
}
