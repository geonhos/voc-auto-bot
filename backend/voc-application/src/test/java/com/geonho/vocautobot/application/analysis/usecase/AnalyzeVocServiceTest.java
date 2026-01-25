package com.geonho.vocautobot.application.analysis.usecase;

import com.geonho.vocautobot.application.analysis.port.in.dto.AnalyzeVocCommand;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult.CategorySuggestion;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult.PrioritySuggestion;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyzeVocService 테스트")
class AnalyzeVocServiceTest {

    @Mock
    private LlmPort llmPort;

    @InjectMocks
    private AnalyzeVocService analyzeVocService;

    private AnalyzeVocCommand command;
    private VocAnalysisResult expectedResult;

    @BeforeEach
    void setUp() {
        command = new AnalyzeVocCommand(
                "로그인이 안됩니다",
                "크롬 브라우저에서 로그인 버튼을 클릭해도 반응이 없습니다.",
                1L
        );

        List<CategorySuggestion> categories = List.of(
                new CategorySuggestion("버그 리포트", 0.9, "로그인 기능 오류")
        );

        PrioritySuggestion priority = new PrioritySuggestion(
                "HIGH",
                0.85,
                "사용자 접근성에 직접적 영향"
        );

        expectedResult = new VocAnalysisResult(
                categories,
                priority,
                List.of("로그인", "크롬", "버그"),
                "NEGATIVE",
                List.of()
        );
    }

    @Test
    @DisplayName("VOC 분석 성공")
    void analyzeVoc_shouldReturnAnalysisResult() {
        // given
        given(llmPort.analyzeVoc(anyString(), anyString()))
                .willReturn(expectedResult);

        // when
        VocAnalysisResult result = analyzeVocService.analyzeVoc(command);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCategorySuggestions()).hasSize(1);
        assertThat(result.getCategorySuggestions().get(0).getCategoryName())
                .isEqualTo("버그 리포트");
        assertThat(result.getPrioritySuggestion().getPriority()).isEqualTo("HIGH");
        assertThat(result.getKeywords()).containsExactly("로그인", "크롬", "버그");
        assertThat(result.getSentiment()).isEqualTo("NEGATIVE");

        verify(llmPort).analyzeVoc(command.getContent(), command.getTitle());
    }

    @Test
    @DisplayName("제목이 null일 경우 예외 발생")
    void analyzeVoc_shouldThrowException_whenTitleIsNull() {
        // given
        AnalyzeVocCommand invalidCommand = new AnalyzeVocCommand(
                null,
                "내용",
                1L
        );

        // when & then
        assertThatThrownBy(() -> analyzeVocService.analyzeVoc(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("VOC 제목은 필수입니다");
    }

    @Test
    @DisplayName("제목이 빈 문자열일 경우 예외 발생")
    void analyzeVoc_shouldThrowException_whenTitleIsBlank() {
        // given
        AnalyzeVocCommand invalidCommand = new AnalyzeVocCommand(
                "   ",
                "내용",
                1L
        );

        // when & then
        assertThatThrownBy(() -> analyzeVocService.analyzeVoc(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("VOC 제목은 필수입니다");
    }

    @Test
    @DisplayName("내용이 null일 경우 예외 발생")
    void analyzeVoc_shouldThrowException_whenContentIsNull() {
        // given
        AnalyzeVocCommand invalidCommand = new AnalyzeVocCommand(
                "제목",
                null,
                1L
        );

        // when & then
        assertThatThrownBy(() -> analyzeVocService.analyzeVoc(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("VOC 내용은 필수입니다");
    }

    @Test
    @DisplayName("내용이 빈 문자열일 경우 예외 발생")
    void analyzeVoc_shouldThrowException_whenContentIsBlank() {
        // given
        AnalyzeVocCommand invalidCommand = new AnalyzeVocCommand(
                "제목",
                "   ",
                1L
        );

        // when & then
        assertThatThrownBy(() -> analyzeVocService.analyzeVoc(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("VOC 내용은 필수입니다");
    }
}
