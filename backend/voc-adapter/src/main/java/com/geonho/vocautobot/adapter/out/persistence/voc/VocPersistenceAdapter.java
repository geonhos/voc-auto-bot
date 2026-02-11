package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.adapter.out.persistence.voc.mapper.VocMapper;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.application.voc.port.out.UpdateVocSentimentPort;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter for VOC domain.
 * Implements output ports using JPA and converts between domain models and JPA entities.
 */
@Component
@RequiredArgsConstructor
public class VocPersistenceAdapter implements LoadVocPort, SaveVocPort, UpdateVocSentimentPort {

    private final VocJpaRepository vocJpaRepository;
    private final VocMapper vocMapper;

    @Override
    @Transactional(readOnly = true)
    public Optional<VocDomain> loadVocById(Long id) {
        return vocJpaRepository.findById(id)
                .map(vocMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VocDomain> loadVocByTicketId(String ticketId) {
        return vocJpaRepository.findByTicketId(ticketId)
                .map(vocMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VocDomain> loadVocByTicketIdAndEmail(String ticketId, String email) {
        return vocJpaRepository.findByTicketIdAndCustomerEmailIgnoreCase(ticketId, email)
                .map(vocMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VocDomain> loadVocList(
            VocStatus status,
            VocPriority priority,
            Long categoryId,
            Long assigneeId,
            String customerEmail,
            String search,
            Pageable pageable) {

        Specification<VocJpaEntity> spec = VocSpecification.withFilters(
                status, priority, categoryId, assigneeId, customerEmail, search);

        return vocJpaRepository.findAll(spec, pageable)
                .map(vocMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocDomain> loadVocsByIds(List<Long> ids) {
        return vocJpaRepository.findAllById(ids).stream()
                .map(vocMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByTicketId(String ticketId) {
        return vocJpaRepository.existsByTicketId(ticketId);
    }

    @Override
    @Transactional
    public VocDomain saveVoc(VocDomain voc) {
        VocJpaEntity entity;

        if (voc.getId() != null) {
            // Update existing entity
            entity = vocJpaRepository.findById(voc.getId())
                    .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + voc.getId()));

            entity.update(
                    voc.getTitle(),
                    voc.getContent(),
                    voc.getStatus(),
                    voc.getPriority(),
                    voc.getCategoryId(),
                    voc.getAssigneeId()
            );

            // Update attachments
            entity.getAttachments().clear();
            if (voc.getAttachments() != null) {
                voc.getAttachments().forEach(attachment -> {
                    VocAttachmentJpaEntity attachmentEntity = vocMapper.toAttachmentEntity(attachment);
                    entity.addAttachment(attachmentEntity);
                });
            }

            // Update memos
            entity.getMemos().clear();
            if (voc.getMemos() != null) {
                voc.getMemos().forEach(memo -> {
                    VocMemoJpaEntity memoEntity = vocMapper.toMemoEntity(memo);
                    entity.addMemo(memoEntity);
                });
            }
        } else {
            // Create new entity
            entity = vocMapper.toEntity(voc);
        }

        VocJpaEntity savedEntity = vocJpaRepository.save(entity);
        return vocMapper.toDomain(savedEntity);
    }

    @Override
    @Transactional
    public void updateSentiment(Long vocId, String sentiment, Double sentimentConfidence) {
        vocJpaRepository.findById(vocId).ifPresent(entity -> {
            entity.updateSentiment(sentiment, sentimentConfidence);
            vocJpaRepository.save(entity);
        });
    }

    @Override
    @Transactional
    public void deleteVoc(Long id) {
        vocJpaRepository.deleteById(id);
    }
}
