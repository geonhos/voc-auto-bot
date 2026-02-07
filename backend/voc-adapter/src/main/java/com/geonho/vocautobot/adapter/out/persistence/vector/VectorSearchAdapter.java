package com.geonho.vocautobot.adapter.out.persistence.vector;

import com.geonho.vocautobot.adapter.out.ai.EmbeddingService;
import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Vector Search Adapter
 * pgvector를 활용한 유사도 검색 구현
 */
@Component
public class VectorSearchAdapter implements VectorSearchPort {

    private static final Logger log = LoggerFactory.getLogger(VectorSearchAdapter.class);
    private static final double DEFAULT_SIMILARITY_THRESHOLD = 0.7;

    private final VectorEmbeddingRepository vectorEmbeddingRepository;
    private final EmbeddingService embeddingService;

    public VectorSearchAdapter(
            VectorEmbeddingRepository vectorEmbeddingRepository,
            EmbeddingService embeddingService) {
        this.vectorEmbeddingRepository = vectorEmbeddingRepository;
        this.embeddingService = embeddingService;
    }

    @Override
    @Transactional
    public Long saveEmbedding(Long vocId, String text) {
        log.info("Saving embedding for VOC ID: {}", vocId);

        try {
            // 1. 텍스트를 임베딩 벡터로 변환
            float[] embeddingVector = embeddingService.generateEmbedding(text);

            // 2. 벡터를 pgvector 형식 문자열로 변환
            String embeddingString = VectorEmbeddingEntity.vectorToString(embeddingVector);

            // 3. 기존 임베딩이 있는지 확인하고 업데이트 또는 생성
            Optional<VectorEmbeddingEntity> existingEmbedding =
                vectorEmbeddingRepository.findByVocId(vocId);

            VectorEmbeddingEntity entity;
            if (existingEmbedding.isPresent()) {
                entity = existingEmbedding.get();
                entity.updateEmbedding(embeddingString);
                log.debug("Updating existing embedding for VOC ID: {}", vocId);
            } else {
                entity = new VectorEmbeddingEntity(vocId, embeddingString);
                log.debug("Creating new embedding for VOC ID: {}", vocId);
            }

            VectorEmbeddingEntity saved = vectorEmbeddingRepository.save(entity);
            log.info("Successfully saved embedding with ID: {} for VOC ID: {}",
                saved.getId(), vocId);

            return saved.getId();

        } catch (Exception e) {
            log.error("Failed to save embedding for VOC ID: {}", vocId, e);
            throw new VectorSearchException("임베딩 저장 실패", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimilarVocResult> findSimilarVocs(Long vocId, int limit, double threshold) {
        log.info("Finding similar VOCs for VOC ID: {} with limit: {} and threshold: {}",
            vocId, limit, threshold);

        try {
            // VOC의 임베딩이 존재하는지 확인
            Optional<VectorEmbeddingEntity> embedding = vectorEmbeddingRepository.findByVocId(vocId);
            if (embedding.isEmpty()) {
                log.warn("No embedding found for VOC ID: {}", vocId);
                return List.of();
            }

            // pgvector를 이용한 코사인 유사도 검색
            List<VectorEmbeddingRepository.VectorSimilarityProjection> results =
                vectorEmbeddingRepository.findSimilarByVocIdWithThreshold(vocId, threshold, limit);

            List<SimilarVocResult> similarVocs = results.stream()
                    .map(r -> new SimilarVocResult(r.getVocId(), r.getSimilarity()))
                    .collect(Collectors.toList());

            log.info("Found {} similar VOCs for VOC ID: {}", similarVocs.size(), vocId);
            return similarVocs;

        } catch (Exception e) {
            log.error("Failed to find similar VOCs for VOC ID: {}", vocId, e);
            throw new VectorSearchException("유사 VOC 검색 실패", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimilarVocResult> searchByText(String text, int limit, double threshold) {
        log.info("Searching similar VOCs by text with limit: {} and threshold: {}",
            limit, threshold);

        try {
            // 1. 검색 텍스트를 임베딩 벡터로 변환
            float[] embeddingVector = embeddingService.generateEmbedding(text);

            // 2. 벡터를 pgvector 형식 문자열로 변환
            String embeddingString = VectorEmbeddingEntity.vectorToString(embeddingVector);

            // 3. 벡터로 직접 유사도 검색
            List<VectorEmbeddingRepository.VectorSimilarityProjection> results =
                vectorEmbeddingRepository.findSimilarByEmbedding(embeddingString, threshold, limit);

            List<SimilarVocResult> similarVocs = results.stream()
                    .map(r -> new SimilarVocResult(r.getVocId(), r.getSimilarity()))
                    .collect(Collectors.toList());

            log.info("Found {} similar VOCs by text search", similarVocs.size());
            return similarVocs;

        } catch (Exception e) {
            log.error("Failed to search similar VOCs by text", e);
            throw new VectorSearchException("텍스트 기반 유사 VOC 검색 실패", e);
        }
    }

    @Override
    @Transactional
    public void deleteEmbedding(Long vocId) {
        log.info("Deleting embedding for VOC ID: {}", vocId);

        try {
            vectorEmbeddingRepository.deleteByVocId(vocId);
            log.info("Successfully deleted embedding for VOC ID: {}", vocId);

        } catch (Exception e) {
            log.error("Failed to delete embedding for VOC ID: {}", vocId, e);
            throw new VectorSearchException("임베딩 삭제 실패", e);
        }
    }

    /**
     * 임베딩이 존재하는지 확인
     *
     * @param vocId VOC ID
     * @return 존재 여부
     */
    @Override
    public boolean hasEmbedding(Long vocId) {
        return vectorEmbeddingRepository.findByVocId(vocId).isPresent();
    }

    /**
     * Vector Search Exception
     */
    public static class VectorSearchException extends RuntimeException {
        public VectorSearchException(String message) {
            super(message);
        }

        public VectorSearchException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
