package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocAttachment;
import com.geonho.vocautobot.domain.voc.VocMemo;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class VocPersistenceMapper {

    public Voc toDomain(VocJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        Voc voc = Voc.builder()
                .id(entity.getId())
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
                .attachments(new ArrayList<>())
                .memos(new ArrayList<>())
                .build();

        if (entity.getAttachments() != null && !entity.getAttachments().isEmpty()) {
            List<VocAttachment> attachments = entity.getAttachments().stream()
                    .map(this::toAttachmentDomain)
                    .collect(Collectors.toList());
            voc.getAttachments().addAll(attachments);
        }

        if (entity.getMemos() != null && !entity.getMemos().isEmpty()) {
            List<VocMemo> memos = entity.getMemos().stream()
                    .map(this::toMemoDomain)
                    .collect(Collectors.toList());
            voc.getMemos().addAll(memos);
        }

        return voc;
    }

    public VocJpaEntity toEntity(Voc voc) {
        if (voc == null) {
            return null;
        }

        VocJpaEntity entity = new VocJpaEntity(
                voc.getTicketId(),
                voc.getTitle(),
                voc.getContent(),
                voc.getStatus(),
                voc.getPriority(),
                voc.getCategoryId(),
                voc.getCustomerEmail(),
                voc.getCustomerName(),
                voc.getCustomerPhone(),
                voc.getAssigneeId()
        );

        if (voc.getAttachments() != null && !voc.getAttachments().isEmpty()) {
            voc.getAttachments().forEach(attachment -> {
                VocAttachmentJpaEntity attachmentEntity = toAttachmentEntity(attachment);
                entity.addAttachment(attachmentEntity);
            });
        }

        if (voc.getMemos() != null && !voc.getMemos().isEmpty()) {
            voc.getMemos().forEach(memo -> {
                VocMemoJpaEntity memoEntity = toMemoEntity(memo);
                entity.addMemo(memoEntity);
            });
        }

        return entity;
    }

    public VocAttachment toAttachmentDomain(VocAttachmentJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return VocAttachment.builder()
                .id(entity.getId())
                .originalFilename(entity.getOriginalFilename())
                .storedFilename(entity.getStoredFilename())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .contentType(entity.getContentType())
                .build();
    }

    public VocAttachmentJpaEntity toAttachmentEntity(VocAttachment attachment) {
        if (attachment == null) {
            return null;
        }

        return new VocAttachmentJpaEntity(
                attachment.getOriginalFilename(),
                attachment.getStoredFilename(),
                attachment.getFilePath(),
                attachment.getFileSize(),
                attachment.getContentType()
        );
    }

    public VocMemo toMemoDomain(VocMemoJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return VocMemo.builder()
                .id(entity.getId())
                .authorId(entity.getAuthorId())
                .content(entity.getContent())
                .internal(entity.isInternal())
                .build();
    }

    public VocMemoJpaEntity toMemoEntity(VocMemo memo) {
        if (memo == null) {
            return null;
        }

        return new VocMemoJpaEntity(
                memo.getAuthorId(),
                memo.getContent(),
                memo.isInternal()
        );
    }

    public List<Voc> toDomainList(List<VocJpaEntity> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}
