package com.geonho.vocautobot.application.analysis.usecase;

import com.geonho.vocautobot.application.analysis.port.in.AnalyzeVocUseCase;
import com.geonho.vocautobot.application.analysis.port.in.dto.AnalyzeVocCommand;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * VOC 분석 서비스
 * LLM을 활용하여 VOC를 분석하고 분류 정보를 제공
 */
@Service
@Transactional(readOnly = true)
public class AnalyzeVocService implements AnalyzeVocUseCase {

    private final LlmPort llmPort;

    public AnalyzeVocService(LlmPort llmPort) {
        this.llmPort = llmPort;
    }

    @Override
    public VocAnalysisResult analyzeVoc(AnalyzeVocCommand command) {
        validateCommand(command);

        // LLM을 통해 VOC 분석 수행
        VocAnalysisResult result = llmPort.analyzeVoc(
                command.getContent(),
                command.getTitle()
        );

        return result;
    }

    private void validateCommand(AnalyzeVocCommand command) {
        if (command.getTitle() == null || command.getTitle().isBlank()) {
            throw new IllegalArgumentException("VOC 제목은 필수입니다");
        }
        if (command.getContent() == null || command.getContent().isBlank()) {
            throw new IllegalArgumentException("VOC 내용은 필수입니다");
        }
    }
}
