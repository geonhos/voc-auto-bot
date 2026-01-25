package com.geonho.vocautobot.adapter.out.persistence.vector;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class VectorEmbeddingEntityTest {

    @Test
    @DisplayName("VectorEmbeddingEntity 생성 성공")
    void createVectorEmbeddingEntity_shouldSucceed() {
        // given
        Long vocId = 1L;
        String embedding = "[0.1,0.2,0.3,0.4,0.5]";

        // when
        VectorEmbeddingEntity entity = new VectorEmbeddingEntity(vocId, embedding);

        // then
        assertThat(entity).isNotNull();
        assertThat(entity.getVocId()).isEqualTo(vocId);
        assertThat(entity.getEmbedding()).isEqualTo(embedding);
    }

    @Test
    @DisplayName("VOC ID가 null이면 예외 발생")
    void createVectorEmbeddingEntity_withNullVocId_shouldThrowException() {
        // given
        Long vocId = null;
        String embedding = "[0.1,0.2,0.3]";

        // when & then
        assertThatThrownBy(() -> new VectorEmbeddingEntity(vocId, embedding))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VOC ID는 양수여야 합니다");
    }

    @Test
    @DisplayName("VOC ID가 0 이하면 예외 발생")
    void createVectorEmbeddingEntity_withInvalidVocId_shouldThrowException() {
        // given
        Long vocId = 0L;
        String embedding = "[0.1,0.2,0.3]";

        // when & then
        assertThatThrownBy(() -> new VectorEmbeddingEntity(vocId, embedding))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VOC ID는 양수여야 합니다");
    }

    @Test
    @DisplayName("임베딩이 null이면 예외 발생")
    void createVectorEmbeddingEntity_withNullEmbedding_shouldThrowException() {
        // given
        Long vocId = 1L;
        String embedding = null;

        // when & then
        assertThatThrownBy(() -> new VectorEmbeddingEntity(vocId, embedding))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("임베딩 벡터는 비어있을 수 없습니다");
    }

    @Test
    @DisplayName("임베딩이 빈 문자열이면 예외 발생")
    void createVectorEmbeddingEntity_withEmptyEmbedding_shouldThrowException() {
        // given
        Long vocId = 1L;
        String embedding = "";

        // when & then
        assertThatThrownBy(() -> new VectorEmbeddingEntity(vocId, embedding))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("임베딩 벡터는 비어있을 수 없습니다");
    }

    @Test
    @DisplayName("임베딩 업데이트 성공")
    void updateEmbedding_shouldSucceed() {
        // given
        Long vocId = 1L;
        String oldEmbedding = "[0.1,0.2,0.3]";
        String newEmbedding = "[0.4,0.5,0.6]";
        VectorEmbeddingEntity entity = new VectorEmbeddingEntity(vocId, oldEmbedding);

        // when
        entity.updateEmbedding(newEmbedding);

        // then
        assertThat(entity.getEmbedding()).isEqualTo(newEmbedding);
    }

    @Test
    @DisplayName("float 배열을 pgvector 문자열로 변환")
    void vectorToString_shouldConvertCorrectly() {
        // given
        float[] vector = {0.1f, 0.2f, 0.3f, 0.4f, 0.5f};

        // when
        String result = VectorEmbeddingEntity.vectorToString(vector);

        // then
        assertThat(result).isEqualTo("[0.1,0.2,0.3,0.4,0.5]");
    }

    @Test
    @DisplayName("빈 배열을 변환하면 예외 발생")
    void vectorToString_withEmptyArray_shouldThrowException() {
        // given
        float[] vector = {};

        // when & then
        assertThatThrownBy(() -> VectorEmbeddingEntity.vectorToString(vector))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("벡터가 비어있습니다");
    }

    @Test
    @DisplayName("pgvector 문자열을 float 배열로 변환")
    void stringToVector_shouldConvertCorrectly() {
        // given
        String vectorString = "[0.1,0.2,0.3,0.4,0.5]";

        // when
        float[] result = VectorEmbeddingEntity.stringToVector(vectorString);

        // then
        assertThat(result).hasSize(5);
        assertThat(result[0]).isEqualTo(0.1f);
        assertThat(result[4]).isEqualTo(0.5f);
    }

    @Test
    @DisplayName("공백이 포함된 pgvector 문자열도 변환 가능")
    void stringToVector_withSpaces_shouldConvertCorrectly() {
        // given
        String vectorString = "[ 0.1 , 0.2 , 0.3 ]";

        // when
        float[] result = VectorEmbeddingEntity.stringToVector(vectorString);

        // then
        assertThat(result).hasSize(3);
        assertThat(result[0]).isEqualTo(0.1f);
        assertThat(result[2]).isEqualTo(0.3f);
    }

    @Test
    @DisplayName("빈 문자열을 변환하면 예외 발생")
    void stringToVector_withEmptyString_shouldThrowException() {
        // given
        String vectorString = "";

        // when & then
        assertThatThrownBy(() -> VectorEmbeddingEntity.stringToVector(vectorString))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("벡터 문자열이 비어있습니다");
    }

    @Test
    @DisplayName("벡터 변환 왕복 테스트")
    void vectorConversion_roundTrip_shouldBeConsistent() {
        // given
        float[] originalVector = {0.123f, 0.456f, 0.789f};

        // when
        String vectorString = VectorEmbeddingEntity.vectorToString(originalVector);
        float[] convertedVector = VectorEmbeddingEntity.stringToVector(vectorString);

        // then
        assertThat(convertedVector).hasSize(originalVector.length);
        for (int i = 0; i < originalVector.length; i++) {
            assertThat(convertedVector[i]).isCloseTo(originalVector[i], within(0.0001f));
        }
    }
}
