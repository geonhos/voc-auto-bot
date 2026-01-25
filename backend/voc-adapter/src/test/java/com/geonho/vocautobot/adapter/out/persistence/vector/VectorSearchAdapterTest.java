package com.geonho.vocautobot.adapter.out.persistence.vector;

import com.geonho.vocautobot.adapter.out.ai.EmbeddingService;
import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort.SimilarVocResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VectorSearchAdapterTest {

    @Mock
    private VectorEmbeddingRepository vectorEmbeddingRepository;

    @Mock
    private EmbeddingService embeddingService;

    private VectorSearchAdapter vectorSearchAdapter;

    @BeforeEach
    void setUp() {
        vectorSearchAdapter = new VectorSearchAdapter(vectorEmbeddingRepository, embeddingService);
    }

    @Test
    @DisplayName("임베딩 저장 성공 - 새로운 임베딩")
    void saveEmbedding_shouldCreateNewEmbedding() {
        // given
        Long vocId = 1L;
        String text = "VOC 제목과 내용";
        float[] embeddingVector = new float[]{0.1f, 0.2f, 0.3f};
        String embeddingString = "[0.1,0.2,0.3]";

        VectorEmbeddingEntity entity = new VectorEmbeddingEntity(vocId, embeddingString);

        when(embeddingService.generateEmbedding(text)).thenReturn(embeddingVector);
        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.empty());
        when(vectorEmbeddingRepository.save(any(VectorEmbeddingEntity.class))).thenReturn(entity);

        // when
        Long result = vectorSearchAdapter.saveEmbedding(vocId, text);

        // then
        assertThat(result).isNotNull();
        verify(embeddingService).generateEmbedding(text);
        verify(vectorEmbeddingRepository).findByVocId(vocId);
        verify(vectorEmbeddingRepository).save(any(VectorEmbeddingEntity.class));
    }

    @Test
    @DisplayName("임베딩 저장 성공 - 기존 임베딩 업데이트")
    void saveEmbedding_shouldUpdateExistingEmbedding() {
        // given
        Long vocId = 1L;
        String text = "VOC 제목과 내용";
        float[] embeddingVector = new float[]{0.1f, 0.2f, 0.3f};
        String embeddingString = "[0.1,0.2,0.3]";

        VectorEmbeddingEntity existingEntity = new VectorEmbeddingEntity(vocId, "[0.0,0.0,0.0]");

        when(embeddingService.generateEmbedding(text)).thenReturn(embeddingVector);
        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.of(existingEntity));
        when(vectorEmbeddingRepository.save(existingEntity)).thenReturn(existingEntity);

        // when
        Long result = vectorSearchAdapter.saveEmbedding(vocId, text);

        // then
        assertThat(result).isNotNull();
        verify(embeddingService).generateEmbedding(text);
        verify(vectorEmbeddingRepository).findByVocId(vocId);
        verify(vectorEmbeddingRepository).save(existingEntity);
    }

    @Test
    @DisplayName("유사 VOC 검색 성공")
    void findSimilarVocs_shouldReturnSimilarVocs() {
        // given
        Long vocId = 1L;
        int limit = 5;
        double threshold = 0.7;

        VectorEmbeddingEntity entity = new VectorEmbeddingEntity(vocId, "[0.1,0.2,0.3]");

        VectorEmbeddingRepository.VectorSimilarityProjection proj1 = createProjection(2L, 0.85);
        VectorEmbeddingRepository.VectorSimilarityProjection proj2 = createProjection(3L, 0.75);

        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.of(entity));
        when(vectorEmbeddingRepository.findSimilarByVocIdWithThreshold(vocId, threshold, limit))
                .thenReturn(List.of(proj1, proj2));

        // when
        List<SimilarVocResult> results = vectorSearchAdapter.findSimilarVocs(vocId, limit, threshold);

        // then
        assertThat(results).hasSize(2);
        assertThat(results.get(0).vocId()).isEqualTo(2L);
        assertThat(results.get(0).similarityScore()).isEqualTo(0.85);
        assertThat(results.get(1).vocId()).isEqualTo(3L);
        assertThat(results.get(1).similarityScore()).isEqualTo(0.75);

        verify(vectorEmbeddingRepository).findByVocId(vocId);
        verify(vectorEmbeddingRepository).findSimilarByVocIdWithThreshold(vocId, threshold, limit);
    }

    @Test
    @DisplayName("유사 VOC 검색 - 임베딩이 없으면 빈 리스트 반환")
    void findSimilarVocs_withNoEmbedding_shouldReturnEmptyList() {
        // given
        Long vocId = 1L;
        int limit = 5;
        double threshold = 0.7;

        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.empty());

        // when
        List<SimilarVocResult> results = vectorSearchAdapter.findSimilarVocs(vocId, limit, threshold);

        // then
        assertThat(results).isEmpty();
        verify(vectorEmbeddingRepository).findByVocId(vocId);
        verify(vectorEmbeddingRepository, never()).findSimilarByVocIdWithThreshold(anyLong(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("텍스트로 유사 VOC 검색 성공")
    void searchByText_shouldReturnSimilarVocs() {
        // given
        String text = "검색할 VOC 내용";
        int limit = 5;
        double threshold = 0.7;
        float[] embeddingVector = new float[]{0.1f, 0.2f, 0.3f};
        String embeddingString = "[0.1,0.2,0.3]";

        VectorEmbeddingRepository.VectorSimilarityProjection proj1 = createProjection(1L, 0.88);

        when(embeddingService.generateEmbedding(text)).thenReturn(embeddingVector);
        when(vectorEmbeddingRepository.findSimilarByEmbedding(embeddingString, threshold, limit))
                .thenReturn(List.of(proj1));

        // when
        List<SimilarVocResult> results = vectorSearchAdapter.searchByText(text, limit, threshold);

        // then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).vocId()).isEqualTo(1L);
        assertThat(results.get(0).similarityScore()).isEqualTo(0.88);

        verify(embeddingService).generateEmbedding(text);
        verify(vectorEmbeddingRepository).findSimilarByEmbedding(embeddingString, threshold, limit);
    }

    @Test
    @DisplayName("임베딩 삭제 성공")
    void deleteEmbedding_shouldDeleteSuccessfully() {
        // given
        Long vocId = 1L;

        doNothing().when(vectorEmbeddingRepository).deleteByVocId(vocId);

        // when
        vectorSearchAdapter.deleteEmbedding(vocId);

        // then
        verify(vectorEmbeddingRepository).deleteByVocId(vocId);
    }

    @Test
    @DisplayName("임베딩 존재 여부 확인")
    void hasEmbedding_shouldReturnTrue_whenEmbeddingExists() {
        // given
        Long vocId = 1L;
        VectorEmbeddingEntity entity = new VectorEmbeddingEntity(vocId, "[0.1,0.2,0.3]");

        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.of(entity));

        // when
        boolean result = vectorSearchAdapter.hasEmbedding(vocId);

        // then
        assertThat(result).isTrue();
        verify(vectorEmbeddingRepository).findByVocId(vocId);
    }

    @Test
    @DisplayName("임베딩이 없으면 false 반환")
    void hasEmbedding_shouldReturnFalse_whenEmbeddingDoesNotExist() {
        // given
        Long vocId = 1L;

        when(vectorEmbeddingRepository.findByVocId(vocId)).thenReturn(Optional.empty());

        // when
        boolean result = vectorSearchAdapter.hasEmbedding(vocId);

        // then
        assertThat(result).isFalse();
        verify(vectorEmbeddingRepository).findByVocId(vocId);
    }

    private VectorEmbeddingRepository.VectorSimilarityProjection createProjection(Long vocId, Double similarity) {
        return new VectorEmbeddingRepository.VectorSimilarityProjection() {
            @Override
            public Long getVocId() {
                return vocId;
            }

            @Override
            public Double getSimilarity() {
                return similarity;
            }
        };
    }
}
