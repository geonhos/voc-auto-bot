package com.geonho.vocautobot.adapter.out.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.service.AsyncVocAnalysisService.ExtendedNotificationPort;
import com.geonho.vocautobot.domain.voc.Voc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Slack Webhook Notification Adapter
 * Sends VOC event notifications to Slack channel via webhook
 *
 * VOC 인입 시 제목, 내용, AI 분석 결과를 Slack으로 전송
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "slack", name = "enabled", havingValue = "true", matchIfMissing = false)
public class SlackNotificationAdapter implements ExtendedNotificationPort {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final SlackProperties slackProperties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void notifyVocCreated(Voc voc) {
        // 이 메서드는 분석 없이 호출되면 사용됨 (하위 호환성)
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC created notification");
            return;
        }

        try {
            log.info("Sending Slack notification for VOC created: {}", voc.getTicketId());

            String message = buildVocCreatedMessage(voc, null, null);
            sendSlackMessage(message);

            log.info("Slack notification sent successfully for VOC: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC created: {}", voc.getTicketId(), e);
        }
    }

    @Override
    public void notifyVocCreatedWithAnalysis(Voc voc, VocLogAnalysis analysis) {
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC created notification with analysis");
            return;
        }

        try {
            log.info("Sending Slack notification with analysis for VOC: {}", voc.getTicketId());

            String message = buildVocCreatedMessage(voc, analysis, null);
            sendSlackMessage(message);

            log.info("Slack notification with analysis sent successfully for VOC: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC created: {}", voc.getTicketId(), e);
        }
    }

    @Override
    public void notifyVocCreatedWithError(Voc voc, String errorMessage) {
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC created notification");
            return;
        }

        try {
            log.info("Sending Slack notification with error for VOC: {}", voc.getTicketId());

            String message = buildVocCreatedMessage(voc, null, errorMessage);
            sendSlackMessage(message);

            log.info("Slack notification with error sent successfully for VOC: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC created: {}", voc.getTicketId(), e);
        }
    }

    @Override
    public void notifyVocStatusChanged(Voc voc, String previousStatus) {
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC status change notification");
            return;
        }

        try {
            log.info("Sending Slack notification for VOC status changed: {} ({} -> {})",
                    voc.getTicketId(), previousStatus, voc.getStatus());

            String message = buildVocStatusChangedMessage(voc, previousStatus);
            sendSlackMessage(message);

            log.info("Slack notification sent successfully for VOC status change: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC status changed: {}", voc.getTicketId(), e);
        }
    }

    @Override
    public void notifyVocAssigned(Voc voc, String assigneeName) {
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC assignment notification");
            return;
        }

        try {
            log.info("Sending Slack notification for VOC assigned: {} to {}",
                    voc.getTicketId(), assigneeName);

            String message = buildVocAssignedMessage(voc, assigneeName);
            sendSlackMessage(message);

            log.info("Slack notification sent successfully for VOC assignment: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC assigned: {}", voc.getTicketId(), e);
        }
    }

    /**
     * Build Slack message for VOC created event with analysis
     * 규격화된 양식: [제목] [내용] [분석결과]
     */
    private String buildVocCreatedMessage(Voc voc, VocLogAnalysis analysis, String errorMessage) {
        StringBuilder sb = new StringBuilder();

        // ===== [제목] 섹션 =====
        sb.append("*[제목]*\n");
        sb.append(getPriorityEmoji(voc.getPriority().name())).append(" ");
        sb.append("*").append(voc.getTicketId()).append("* - ").append(voc.getTitle()).append("\n");
        sb.append("우선순위: ").append(translatePriority(voc.getPriority().name()));
        sb.append(" | 고객: ").append(voc.getCustomerName() != null ? voc.getCustomerName() : "-");
        if (voc.getCreatedAt() != null) {
            sb.append(" | ").append(voc.getCreatedAt().format(DATE_FORMATTER));
        }
        sb.append("\n\n");

        // ===== [내용] 섹션 =====
        sb.append("*[내용]*\n");
        if (voc.getContent() != null && !voc.getContent().isEmpty()) {
            String preview = voc.getContent().length() > 500
                    ? voc.getContent().substring(0, 500) + "..."
                    : voc.getContent();
            sb.append(preview).append("\n\n");
        } else {
            sb.append("(내용 없음)\n\n");
        }

        // ===== [분석결과] 섹션 =====
        sb.append("*[분석결과]*\n");

        if (analysis != null && analysis.isValid()) {
            // 신뢰도
            double confidence = analysis.confidence() != null ? analysis.confidence() : 0.0;
            sb.append("신뢰도: ").append(getConfidenceBar(confidence));
            sb.append(String.format(" %.0f%%\n", confidence * 100));

            // 분석 요약
            if (analysis.summary() != null && !analysis.summary().isEmpty()) {
                sb.append("요약: ").append(analysis.summary()).append("\n");
            }

            // 예상 원인
            if (analysis.possibleCauses() != null && !analysis.possibleCauses().isEmpty()) {
                sb.append("예상 원인:\n");
                for (String cause : analysis.possibleCauses()) {
                    sb.append("  • ").append(cause).append("\n");
                }
            }

            // 권장 조치
            if (analysis.recommendation() != null && !analysis.recommendation().isEmpty()) {
                sb.append("권장 조치: ").append(analysis.recommendation()).append("\n");
            }
        } else if (errorMessage != null) {
            sb.append("분석 실패: ").append(errorMessage).append("\n");
        } else {
            sb.append("분석 대기 중...\n");
        }

        return sb.toString();
    }

    /**
     * Build Slack message for VOC status changed event
     * 규격화된 양식: [제목] [내용] [분석결과]
     */
    private String buildVocStatusChangedMessage(Voc voc, String previousStatus) {
        StringBuilder sb = new StringBuilder();

        // ===== [제목] 섹션 =====
        sb.append("*[제목]*\n");
        sb.append("🔄 *").append(voc.getTicketId()).append("* - 상태 변경\n");
        sb.append(voc.getTitle()).append("\n\n");

        // ===== [내용] 섹션 =====
        sb.append("*[내용]*\n");
        sb.append("상태: ").append(translateStatus(previousStatus)).append(" → *")
                .append(translateStatus(voc.getStatus().name())).append("*\n");
        sb.append("우선순위: ").append(getPriorityEmoji(voc.getPriority().name())).append(" ")
                .append(translatePriority(voc.getPriority().name())).append("\n");
        if (voc.getAssigneeId() != null) {
            sb.append("담당자 ID: ").append(voc.getAssigneeId()).append("\n");
        }
        if (voc.getUpdatedAt() != null) {
            sb.append("변경일시: ").append(voc.getUpdatedAt().format(DATE_FORMATTER)).append("\n");
        }

        return sb.toString();
    }

    /**
     * Build Slack message for VOC assigned event
     * 규격화된 양식: [제목] [내용]
     */
    private String buildVocAssignedMessage(Voc voc, String assigneeName) {
        StringBuilder sb = new StringBuilder();

        // ===== [제목] 섹션 =====
        sb.append("*[제목]*\n");
        sb.append("👤 *").append(voc.getTicketId()).append("* - 담당자 배정\n");
        sb.append(voc.getTitle()).append("\n\n");

        // ===== [내용] 섹션 =====
        sb.append("*[내용]*\n");
        sb.append("담당자: @").append(assigneeName).append("\n");
        sb.append("우선순위: ").append(getPriorityEmoji(voc.getPriority().name())).append(" ")
                .append(translatePriority(voc.getPriority().name())).append("\n");
        sb.append("상태: ").append(translateStatus(voc.getStatus().name())).append("\n");
        if (voc.getUpdatedAt() != null) {
            sb.append("배정일시: ").append(voc.getUpdatedAt().format(DATE_FORMATTER)).append("\n");
        }

        return sb.toString();
    }

    private String getPriorityEmoji(String priority) {
        return switch (priority) {
            case "URGENT" -> "🔴";
            case "HIGH" -> "🟠";
            case "NORMAL" -> "🟡";
            case "LOW" -> "🟢";
            default -> "⚪";
        };
    }

    private String translatePriority(String priority) {
        return switch (priority) {
            case "URGENT" -> "긴급";
            case "HIGH" -> "높음";
            case "NORMAL" -> "보통";
            case "LOW" -> "낮음";
            default -> priority;
        };
    }

    private String translateStatus(String status) {
        return switch (status) {
            case "NEW" -> "접수";
            case "IN_PROGRESS" -> "처리중";
            case "PENDING" -> "보류";
            case "RESOLVED" -> "완료";
            case "CLOSED" -> "종료";
            case "REJECTED" -> "반려";
            default -> status;
        };
    }

    private String getConfidenceBar(double confidence) {
        int filled = (int) (confidence * 10);
        return "▓".repeat(filled) + "░".repeat(10 - filled);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    /**
     * Send message to Slack webhook
     */
    private void sendSlackMessage(String message) throws NotificationException {
        if (slackProperties.getWebhookUrl() == null || slackProperties.getWebhookUrl().isEmpty()) {
            log.warn("Slack webhook URL not configured, skipping notification");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", message);

            if (slackProperties.getUsername() != null) {
                payload.put("username", slackProperties.getUsername());
            }

            if (slackProperties.getIconEmoji() != null) {
                payload.put("icon_emoji", slackProperties.getIconEmoji());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            log.debug("Sending Slack message to webhook URL");
            restTemplate.postForEntity(slackProperties.getWebhookUrl(), entity, String.class);

        } catch (Exception e) {
            throw new NotificationException("Failed to send Slack notification: " + e.getMessage(), e);
        }
    }

    /**
     * Check if Slack notifications are enabled
     */
    private boolean isEnabled() {
        return slackProperties.isEnabled()
                && slackProperties.getWebhookUrl() != null
                && !slackProperties.getWebhookUrl().isEmpty();
    }
}
