package com.geonho.vocautobot.adapter.out.persistence.email;

import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class EmailPersistenceMapper {

    // ===== EmailTemplate Mapping =====

    public EmailTemplate toDomain(EmailTemplateJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return new EmailTemplate(
                entity.getId(),
                entity.getName(),
                entity.getSubject(),
                entity.getBody(),
                entity.getVariables(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public EmailTemplateJpaEntity toEntity(EmailTemplate template) {
        if (template == null) {
            return null;
        }

        return new EmailTemplateJpaEntity(
                template.getName(),
                template.getSubject(),
                template.getBody(),
                template.getVariables(),
                template.isActive()
        );
    }

    public List<EmailTemplate> toTemplateDomainList(List<EmailTemplateJpaEntity> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    // ===== EmailLog Mapping =====

    public EmailLog toDomain(EmailLogJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        EmailLog emailLog = new EmailLog(
                entity.getId(),
                entity.getTemplateId(),
                entity.getRecipientEmail(),
                entity.getRecipientName(),
                entity.getSubject(),
                entity.getBody(),
                entity.getStatus(),
                entity.getSentAt(),
                entity.getErrorMessage(),
                entity.getCreatedAt()
        );

        emailLog.setId(entity.getId());
        return emailLog;
    }

    public EmailLogJpaEntity toEntity(EmailLog log) {
        if (log == null) {
            return null;
        }

        return new EmailLogJpaEntity(
                log.getTemplateId(),
                log.getRecipientEmail(),
                log.getRecipientName(),
                log.getSubject(),
                log.getBody(),
                log.getStatus(),
                log.getSentAt(),
                log.getErrorMessage()
        );
    }

    public List<EmailLog> toLogDomainList(List<EmailLogJpaEntity> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}
