package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import com.geonho.vocautobot.application.analysis.port.out.VocAnalysisPersistencePort;
import com.geonho.vocautobot.domain.voc.VocAnalysis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * VOC 분석 결과 영속성 어댑터
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VocAnalysisPersistenceAdapter implements VocAnalysisPersistencePort {

    private final VocAnalysisJpaRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public VocAnalysisDto createPendingAnalysis(Long vocId) {
        VocAnalysisJpaEntity entity = new VocAnalysisJpaEntity(vocId);
        VocAnalysisJpaEntity saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VocAnalysisDto> findByVocId(Long vocId) {
        return repository.findByVocId(vocId).map(this::toDto);
    }

    @Override
    @Transactional
    public void startAnalysis(Long vocId) {
        repository.findByVocId(vocId).ifPresent(VocAnalysisJpaEntity::startAnalysis);
    }

    @Override
    @Transactional
    public void completeAnalysis(Long vocId, String summary, Double confidence, String keywords,
                                  String possibleCauses, String relatedLogs, String recommendation) {
        repository.findByVocId(vocId).ifPresent(entity ->
            entity.completeAnalysis(summary, confidence, keywords, possibleCauses, relatedLogs, recommendation)
        );
    }

    @Override
    @Transactional
    public void failAnalysis(Long vocId, String errorMessage) {
        repository.findByVocId(vocId).ifPresent(entity -> entity.failAnalysis(errorMessage));
    }

    @Override
    @Transactional
    public void resetAnalysis(Long vocId) {
        repository.findByVocId(vocId).ifPresent(VocAnalysisJpaEntity::resetAnalysis);
    }

    private VocAnalysisDto toDto(VocAnalysisJpaEntity entity) {
        List<String> keywords = parseJsonList(entity.getKeywords());
        List<String> possibleCauses = parseJsonList(entity.getPossibleCauses());
        List<VocAnalysisDto.RelatedLogDto> relatedLogs = parseRelatedLogs(entity.getRelatedLogs());

        return new VocAnalysisDto(
            entity.getId(),
            entity.getVocId(),
            entity.getStatus().name(),
            entity.getSummary(),
            entity.getConfidence(),
            keywords,
            possibleCauses,
            relatedLogs,
            entity.getRecommendation(),
            entity.getErrorMessage(),
            entity.getAnalyzedAt(),
            entity.getCreatedAt()
        );
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON list: {}", json, e);
            return Collections.emptyList();
        }
    }

    private List<VocAnalysisDto.RelatedLogDto> parseRelatedLogs(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse related logs: {}", json, e);
            return Collections.emptyList();
        }
    }
}
