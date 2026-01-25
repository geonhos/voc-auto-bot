package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class VocPersistenceAdapter implements LoadVocPort, SaveVocPort {

    private final VocJpaRepository vocJpaRepository;
    private final VocPersistenceMapper vocPersistenceMapper;

    @Override
    @Transactional(readOnly = true)
    public Optional<Voc> loadVocById(Long id) {
        return vocJpaRepository.findById(id)
                .map(vocPersistenceMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Voc> loadVocByTicketId(String ticketId) {
        return vocJpaRepository.findByTicketId(ticketId)
                .map(vocPersistenceMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Voc> loadVocList(
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
                .map(vocPersistenceMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByTicketId(String ticketId) {
        return vocJpaRepository.existsByTicketId(ticketId);
    }

    @Override
    @Transactional
    public Voc saveVoc(Voc voc) {
        VocJpaEntity entity;

        if (voc.getId() != null) {
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

            entity.getAttachments().clear();
            if (voc.getAttachments() != null) {
                voc.getAttachments().forEach(attachment -> {
                    VocAttachmentJpaEntity attachmentEntity = vocPersistenceMapper.toAttachmentEntity(attachment);
                    entity.addAttachment(attachmentEntity);
                });
            }

            entity.getMemos().clear();
            if (voc.getMemos() != null) {
                voc.getMemos().forEach(memo -> {
                    VocMemoJpaEntity memoEntity = vocPersistenceMapper.toMemoEntity(memo);
                    entity.addMemo(memoEntity);
                });
            }
        } else {
            entity = vocPersistenceMapper.toEntity(voc);
        }

        VocJpaEntity savedEntity = vocJpaRepository.save(entity);
        return vocPersistenceMapper.toDomain(savedEntity);
    }

    @Override
    @Transactional
    public void deleteVoc(Long id) {
        vocJpaRepository.deleteById(id);
    }
}
