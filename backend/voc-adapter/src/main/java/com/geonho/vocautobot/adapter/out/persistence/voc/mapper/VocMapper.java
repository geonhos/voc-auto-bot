package com.geonho.vocautobot.adapter.out.persistence.voc.mapper;

import com.geonho.vocautobot.adapter.out.persistence.voc.VocAttachmentJpaEntity;
import com.geonho.vocautobot.adapter.out.persistence.voc.VocJpaEntity;
import com.geonho.vocautobot.adapter.out.persistence.voc.VocMemoJpaEntity;
import com.geonho.vocautobot.domain.voc.VocAttachmentDomain;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocMemoDomain;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between VocDomain and VocJpaEntity.
 * This class handles the conversion between pure domain models and JPA entities.
 */
@Component
public class VocMapper {

    /**
     * Converts JPA entity to domain model.
     *
     * @param entity the JPA entity
     * @return the domain model
     */
    public VocDomain toDomain(VocJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        VocDomain domain = VocDomain.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .ticketId(entity.getTicketId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .categoryId(entity.getCategoryId())
                .customerEmail(entity.getCustomerEmail())
                .customerName(entity.getCustomerName())
                .customerPhone(entity.getCustomerPhone())
                .assigneeId(entity.getAssigneeId())
                .resolvedAt(entity.getResolvedAt())
                .closedAt(entity.getClosedAt())
                .sentiment(entity.getSentiment())
                .sentimentConfidence(entity.getSentimentConfidence())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .attachments(new ArrayList<>())
                .memos(new ArrayList<>())
                .build();

        // Map attachments
        if (entity.getAttachments() != null && !entity.getAttachments().isEmpty()) {
            List<VocAttachmentDomain> attachments = entity.getAttachments().stream()
                    .map(this::toAttachmentDomain)
                    .collect(Collectors.toList());
            domain.setAttachmentsForReconstruction(attachments);
        }

        // Map memos
        if (entity.getMemos() != null && !entity.getMemos().isEmpty()) {
            List<VocMemoDomain> memos = entity.getMemos().stream()
                    .map(this::toMemoDomain)
                    .collect(Collectors.toList());
            domain.setMemosForReconstruction(memos);
        }

        return domain;
    }

    /**
     * Converts domain model to JPA entity.
     *
     * @param domain the domain model
     * @return the JPA entity
     */
    public VocJpaEntity toEntity(VocDomain domain) {
        if (domain == null) {
            return null;
        }

        VocJpaEntity entity = new VocJpaEntity(
                domain.getTicketId(),
                domain.getTitle(),
                domain.getContent(),
                domain.getStatus(),
                domain.getPriority(),
                domain.getCategoryId(),
                domain.getCustomerEmail(),
                domain.getCustomerName(),
                domain.getCustomerPhone(),
                domain.getAssigneeId()
        );

        // Map attachments
        if (domain.getAttachments() != null && !domain.getAttachments().isEmpty()) {
            domain.getAttachments().forEach(attachment -> {
                VocAttachmentJpaEntity attachmentEntity = toAttachmentEntity(attachment);
                entity.addAttachment(attachmentEntity);
            });
        }

        // Map memos
        if (domain.getMemos() != null && !domain.getMemos().isEmpty()) {
            domain.getMemos().forEach(memo -> {
                VocMemoJpaEntity memoEntity = toMemoEntity(memo);
                entity.addMemo(memoEntity);
            });
        }

        return entity;
    }

    /**
     * Converts attachment JPA entity to domain model.
     *
     * @param entity the JPA entity
     * @return the domain model
     */
    public VocAttachmentDomain toAttachmentDomain(VocAttachmentJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return VocAttachmentDomain.builder()
                .id(entity.getId())
                .vocId(entity.getVoc() != null ? entity.getVoc().getId() : null)
                .originalFilename(entity.getOriginalFilename())
                .storedFilename(entity.getStoredFilename())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .contentType(entity.getContentType())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Converts attachment domain model to JPA entity.
     *
     * @param domain the domain model
     * @return the JPA entity
     */
    public VocAttachmentJpaEntity toAttachmentEntity(VocAttachmentDomain domain) {
        if (domain == null) {
            return null;
        }

        return new VocAttachmentJpaEntity(
                domain.getOriginalFilename(),
                domain.getStoredFilename(),
                domain.getFilePath(),
                domain.getFileSize(),
                domain.getContentType()
        );
    }

    /**
     * Converts memo JPA entity to domain model.
     *
     * @param entity the JPA entity
     * @return the domain model
     */
    public VocMemoDomain toMemoDomain(VocMemoJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return VocMemoDomain.builder()
                .id(entity.getId())
                .vocId(entity.getVoc() != null ? entity.getVoc().getId() : null)
                .authorId(entity.getAuthorId())
                .content(entity.getContent())
                .internal(entity.isInternal())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Converts memo domain model to JPA entity.
     *
     * @param domain the domain model
     * @return the JPA entity
     */
    public VocMemoJpaEntity toMemoEntity(VocMemoDomain domain) {
        if (domain == null) {
            return null;
        }

        return new VocMemoJpaEntity(
                domain.getAuthorId(),
                domain.getContent(),
                domain.isInternal()
        );
    }

    /**
     * Converts a list of JPA entities to domain models.
     *
     * @param entities the list of JPA entities
     * @return the list of domain models
     */
    public List<VocDomain> toDomainList(List<VocJpaEntity> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}
