package com.geonho.vocautobot.application.category.usecase;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import com.geonho.vocautobot.application.category.port.in.dto.CategorySuggestionResult;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("카테고리 추천 서비스 테스트")
class SuggestCategoryServiceTest {

    @Mock
    private LlmPort llmPort;

    @Mock
    private LoadCategoryPort loadCategoryPort;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SuggestCategoryService suggestCategoryService;

    private static Category createCategory(Long id, String name, String code) {
        return new Category(
                id, name, code, CategoryType.SUB, 1L,
                name + " 관련", true, 1, 2,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("카테고리 추천 성공")
    class SuggestCategoriesSuccess {

        @Test
        @DisplayName("3개의 카테고리가 올바르게 매칭되어 반환된다")
        void shouldReturnThreeMatchedCategories() {
            // given
            List<Category> categories = List.of(
                    createCategory(1L, "결제 문의", "PAYMENT"),
                    createCategory(2L, "배송 문의", "DELIVERY"),
                    createCategory(3L, "환불 요청", "REFUND")
            );
            given(loadCategoryPort.loadActiveCategories()).willReturn(categories);

            String llmResponse = """
                    {
                      "suggestions": [
                        {"categoryName": "결제 문의", "confidence": 0.9, "reason": "결제 관련 키워드"},
                        {"categoryName": "환불 요청", "confidence": 0.7, "reason": "환불 언급"},
                        {"categoryName": "배송 문의", "confidence": 0.5, "reason": "배송 관련"}
                      ]
                    }
                    """;
            given(llmPort.sendPrompt(anyString())).willReturn(llmResponse);

            // when
            List<CategorySuggestionResult> results = suggestCategoryService.suggestCategories(
                    "결제 오류", "결제 시 500 에러가 발생합니다"
            );

            // then
            assertThat(results).hasSize(3);
            assertThat(results.get(0).categoryName()).isEqualTo("결제 문의");
            assertThat(results.get(0).categoryId()).isEqualTo(1L);
            assertThat(results.get(0).confidence()).isEqualTo(0.9);
            assertThat(results.get(1).categoryName()).isEqualTo("환불 요청");
            assertThat(results.get(2).categoryName()).isEqualTo("배송 문의");
        }
    }

    @Nested
    @DisplayName("카테고리 추천 오류 처리")
    class SuggestCategoriesErrorHandling {

        @Test
        @DisplayName("LLM 오류 시 빈 리스트를 반환한다")
        void shouldReturnEmptyListOnLlmError() {
            // given
            List<Category> categories = List.of(
                    createCategory(1L, "결제 문의", "PAYMENT")
            );
            given(loadCategoryPort.loadActiveCategories()).willReturn(categories);
            given(llmPort.sendPrompt(anyString())).willThrow(new RuntimeException("LLM 서버 오류"));

            // when
            List<CategorySuggestionResult> results = suggestCategoryService.suggestCategories(
                    "테스트 제목", "테스트 내용"
            );

            // then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("매칭되지 않는 카테고리명은 건너뛴다")
        void shouldSkipUnmatchedCategoryNames() {
            // given
            List<Category> categories = List.of(
                    createCategory(1L, "결제 문의", "PAYMENT"),
                    createCategory(2L, "배송 문의", "DELIVERY")
            );
            given(loadCategoryPort.loadActiveCategories()).willReturn(categories);

            String llmResponse = """
                    {
                      "suggestions": [
                        {"categoryName": "존재하지 않는 카테고리", "confidence": 0.9, "reason": "매칭 안됨"},
                        {"categoryName": "결제 문의", "confidence": 0.8, "reason": "결제 관련"},
                        {"categoryName": "또 없는 카테고리", "confidence": 0.7, "reason": "매칭 안됨"}
                      ]
                    }
                    """;
            given(llmPort.sendPrompt(anyString())).willReturn(llmResponse);

            // when
            List<CategorySuggestionResult> results = suggestCategoryService.suggestCategories(
                    "결제 오류", "결제 시 오류 발생"
            );

            // then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).categoryName()).isEqualTo("결제 문의");
            assertThat(results.get(0).categoryId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("활성 카테고리가 없으면 빈 리스트를 반환한다")
        void shouldReturnEmptyListWhenNoCategoriesExist() {
            // given
            given(loadCategoryPort.loadActiveCategories()).willReturn(List.of());

            // when
            List<CategorySuggestionResult> results = suggestCategoryService.suggestCategories(
                    "테스트 제목", "테스트 내용"
            );

            // then
            assertThat(results).isEmpty();
        }
    }
}
