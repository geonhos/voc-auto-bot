package com.geonho.vocautobot.adapter.out.persistence.email;

import com.geonho.vocautobot.domain.email.EmailStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailLogJpaRepository extends JpaRepository<EmailLogJpaEntity, Long> {

    /**
     * 템플릿 ID로 로그 조회
     */
    List<EmailLogJpaEntity> findByTemplateId(Long templateId);

    /**
     * 수신자 이메일로 로그 조회
     */
    List<EmailLogJpaEntity> findByRecipientEmail(String recipientEmail);

    /**
     * 상태별 로그 조회
     */
    List<EmailLogJpaEntity> findByStatus(EmailStatus status);

    /**
     * 템플릿 ID와 상태로 로그 조회
     */
    List<EmailLogJpaEntity> findByTemplateIdAndStatus(Long templateId, EmailStatus status);
}
