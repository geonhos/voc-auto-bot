package com.geonho.vocautobot.adapter.out.persistence.email;

import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailLogPort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailTemplatePort;
import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailStatus;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
public class EmailPersistenceAdapter implements
        LoadEmailTemplatePort,
        SaveEmailTemplatePort,
        SaveEmailLogPort {

    private final EmailTemplateJpaRepository emailTemplateRepository;
    private final EmailLogJpaRepository emailLogRepository;
    private final EmailPersistenceMapper mapper;

    public EmailPersistenceAdapter(
            EmailTemplateJpaRepository emailTemplateRepository,
            EmailLogJpaRepository emailLogRepository,
            EmailPersistenceMapper mapper) {
        this.emailTemplateRepository = emailTemplateRepository;
        this.emailLogRepository = emailLogRepository;
        this.mapper = mapper;
    }

    // ===== LoadEmailTemplatePort Implementation =====

    @Override
    @Transactional(readOnly = true)
    public Optional<EmailTemplate> loadTemplateById(Long id) {
        return emailTemplateRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EmailTemplate> loadTemplateByName(String name) {
        return emailTemplateRepository.findByName(name)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplate> loadActiveTemplates() {
        List<EmailTemplateJpaEntity> entities = emailTemplateRepository.findByIsActiveTrue();
        return mapper.toTemplateDomainList(entities);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplate> loadAllTemplates() {
        List<EmailTemplateJpaEntity> entities = emailTemplateRepository.findAll();
        return mapper.toTemplateDomainList(entities);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return emailTemplateRepository.existsByName(name);
    }

    // ===== SaveEmailTemplatePort Implementation =====

    @Override
    @Transactional
    public EmailTemplate saveEmailTemplate(EmailTemplate template) {
        EmailTemplateJpaEntity entity;

        if (template.getId() != null) {
            // Update existing template
            entity = emailTemplateRepository.findById(template.getId())
                    .orElseThrow(() -> new IllegalArgumentException("이메일 템플릿을 찾을 수 없습니다"));

            entity.update(
                    template.getName(),
                    template.getSubject(),
                    template.getBody(),
                    template.getVariables()
            );

            if (template.isActive()) {
                entity.activate();
            } else {
                entity.deactivate();
            }
        } else {
            // Create new template
            entity = mapper.toEntity(template);
        }

        EmailTemplateJpaEntity savedEntity = emailTemplateRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    @Transactional
    public void deleteEmailTemplate(Long id) {
        emailTemplateRepository.deleteById(id);
    }

    // ===== SaveEmailLogPort Implementation =====

    @Override
    @Transactional
    public EmailLog saveEmailLog(EmailLog log) {
        EmailLogJpaEntity entity;

        if (log.getId() != null) {
            // Update existing log
            entity = emailLogRepository.findById(log.getId())
                    .orElseThrow(() -> new IllegalArgumentException("이메일 로그를 찾을 수 없습니다"));

            // Update status based on domain state
            if (log.isSent()) {
                entity.markAsSent();
            } else if (log.isFailed()) {
                entity.markAsFailed(log.getErrorMessage());
            }
        } else {
            // Create new log
            entity = mapper.toEntity(log);
        }

        EmailLogJpaEntity savedEntity = emailLogRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    // ===== Additional Query Methods =====

    @Transactional(readOnly = true)
    public Optional<EmailLog> findLogById(Long id) {
        return emailLogRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Transactional(readOnly = true)
    public List<EmailLog> findLogsByTemplateId(Long templateId) {
        List<EmailLogJpaEntity> entities = emailLogRepository.findByTemplateId(templateId);
        return mapper.toLogDomainList(entities);
    }

    @Transactional(readOnly = true)
    public List<EmailLog> findLogsByRecipientEmail(String recipientEmail) {
        List<EmailLogJpaEntity> entities = emailLogRepository.findByRecipientEmail(recipientEmail);
        return mapper.toLogDomainList(entities);
    }

    @Transactional(readOnly = true)
    public List<EmailLog> findLogsByStatus(EmailStatus status) {
        List<EmailLogJpaEntity> entities = emailLogRepository.findByStatus(status);
        return mapper.toLogDomainList(entities);
    }
}
