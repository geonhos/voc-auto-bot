package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.application.voc.port.out.LoadStatusHistoryPort;
import com.geonho.vocautobot.application.voc.port.out.SaveStatusHistoryPort;
import com.geonho.vocautobot.domain.voc.VocStatusHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StatusHistoryPersistenceAdapter implements SaveStatusHistoryPort, LoadStatusHistoryPort {

    private final VocStatusHistoryRepository statusHistoryRepository;
    private final VocJpaRepository vocJpaRepository;

    @Override
    public void saveStatusHistory(VocStatusHistory history) {
        VocJpaEntity vocEntity = vocJpaRepository.getReferenceById(history.getVocId());
        VocStatusHistoryJpaEntity entity = VocStatusHistoryJpaEntity.fromDomain(history, vocEntity);
        statusHistoryRepository.save(entity);
    }

    @Override
    public List<VocStatusHistory> loadStatusHistoryByVocId(Long vocId) {
        return statusHistoryRepository.findByVocIdOrderByCreatedAtAsc(vocId).stream()
                .map(VocStatusHistoryJpaEntity::toDomain)
                .toList();
    }
}
