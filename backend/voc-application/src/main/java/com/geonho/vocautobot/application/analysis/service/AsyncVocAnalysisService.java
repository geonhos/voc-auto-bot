package com.geonho.vocautobot.application.analysis.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.port.out.VocAnalysisPersistencePort;
import com.geonho.vocautobot.application.notification.port.out.NotificationPort;
import com.geonho.vocautobot.domain.voc.VocDomain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.geonho.vocautobot.application.voc.port.in.GetVocDetailUseCase;

import java.util.Optional;

/**
 * VOC 비동기 분석 서비스
 * VOC 생성 후 백그라운드에서 AI 분석을 수행하고
 * 분석 완료 후 Slack 알림 전송
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncVocAnalysisService {

    private final VocLogAnalysisService vocLogAnalysisService;
    private final VocAnalysisPersistencePort vocAnalysisPersistencePort;
    private final GetVocDetailUseCase getVocDetailUseCase;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private NotificationPort notificationPort;

    /**
     * VOC 분석 레코드 생성 (PENDING 상태)
     * VOC 생성 직후 호출됨
     */
    public VocAnalysisDto createPendingAnalysis(Long vocId) {
        return vocAnalysisPersistencePort.createPendingAnalysis(vocId);
    }

    /**
     * VOC ID로 분석 결과 조회
     */
    public Optional<VocAnalysisDto> getAnalysis(Long vocId) {
        return vocAnalysisPersistencePort.findByVocId(vocId);
    }

    /**
     * VOC 재분석 요청
     * 기존 분석 결과를 초기화하고 다시 분석 수행
     *
     * @param vocId VOC ID
     * @return true: 재분석 시작, false: 이미 분석 중 (409 충돌)
     */
    public boolean reanalyzeVoc(Long vocId) {
        Optional<VocAnalysisDto> existingAnalysis = vocAnalysisPersistencePort.findByVocId(vocId);

        if (existingAnalysis.isPresent()) {
            String status = existingAnalysis.get().status();
            if ("PENDING".equals(status) || "IN_PROGRESS".equals(status)) {
                log.warn("VOC {} is already being analyzed (status: {})", vocId, status);
                return false;
            }
        }

        // 분석 결과 초기화
        vocAnalysisPersistencePort.resetAnalysis(vocId);

        // VOC 도메인 조회 후 비동기 분석 재시작
        VocDomain voc = getVocDetailUseCase.getVocById(vocId);
        analyzeVocAsync(voc);

        log.info("Reanalysis triggered for VOC ID: {}", vocId);
        return true;
    }

    /**
     * 비동기로 VOC 분석 수행
     * 분석 완료 후 Slack 알림 전송
     */
    @Async("analysisExecutor")
    public void analyzeVocAsync(VocDomain voc) {
        Long vocId = voc.getId();
        log.info("Starting async analysis for VOC: {} (ID: {})", voc.getTicketId(), vocId);

        try {
            // 분석 시작 상태로 변경
            vocAnalysisPersistencePort.startAnalysis(vocId);

            // AI 분석 수행
            VocLogAnalysis analysis = vocLogAnalysisService.analyzeLogsForVoc(
                voc.getTitle(),
                voc.getContent()
            );

            // 분석 결과 저장
            saveAnalysisResult(vocId, analysis);

            log.info("Async analysis completed for VOC: {} with confidence: {}",
                voc.getTicketId(), analysis.confidence());

            // Slack 알림 전송 (분석 결과 포함)
            sendSlackNotificationWithAnalysis(voc, analysis);

        } catch (Exception e) {
            log.error("Failed to analyze VOC: {} (ID: {})", voc.getTicketId(), vocId, e);
            vocAnalysisPersistencePort.failAnalysis(vocId, e.getMessage());

            // 분석 실패해도 기본 Slack 알림 전송
            sendSlackNotificationWithoutAnalysis(voc, e.getMessage());
        }
    }

    private void saveAnalysisResult(Long vocId, VocLogAnalysis analysis) {
        try {
            String keywordsJson = objectMapper.writeValueAsString(analysis.keywords());
            String causesJson = objectMapper.writeValueAsString(analysis.possibleCauses());
            String logsJson = objectMapper.writeValueAsString(analysis.relatedLogs());

            vocAnalysisPersistencePort.completeAnalysis(
                vocId,
                analysis.summary(),
                analysis.confidence(),
                keywordsJson,
                causesJson,
                logsJson,
                analysis.recommendation()
            );
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize analysis result for VOC ID: {}", vocId, e);
            vocAnalysisPersistencePort.failAnalysis(vocId, "분석 결과 저장 실패: " + e.getMessage());
        }
    }

    private void sendSlackNotificationWithAnalysis(VocDomain voc, VocLogAnalysis analysis) {
        if (notificationPort == null) {
            log.debug("NotificationPort not available, skipping Slack notification");
            return;
        }

        try {
            // NotificationPort의 확장 메서드 사용 (분석 결과 포함)
            if (notificationPort instanceof ExtendedNotificationPort extendedPort) {
                extendedPort.notifyVocCreatedWithAnalysis(voc, analysis);
            } else {
                // 기본 알림 전송
                notificationPort.notifyVocCreated(voc);
            }
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC: {}", voc.getTicketId(), e);
        }
    }

    private void sendSlackNotificationWithoutAnalysis(VocDomain voc, String errorMessage) {
        if (notificationPort == null) {
            log.debug("NotificationPort not available, skipping Slack notification");
            return;
        }

        try {
            if (notificationPort instanceof ExtendedNotificationPort extendedPort) {
                extendedPort.notifyVocCreatedWithError(voc, errorMessage);
            } else {
                notificationPort.notifyVocCreated(voc);
            }
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC: {}", voc.getTicketId(), e);
        }
    }

    /**
     * 확장 알림 포트 인터페이스
     * 분석 결과를 포함한 알림 전송 지원
     */
    public interface ExtendedNotificationPort extends NotificationPort {
        void notifyVocCreatedWithAnalysis(VocDomain voc, VocLogAnalysis analysis);
        void notifyVocCreatedWithError(VocDomain voc, String errorMessage);
    }
}
