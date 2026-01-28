package com.geonho.vocautobot.adapter.out.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.notification.port.out.NotificationPort;
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
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "slack", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SlackNotificationAdapter implements NotificationPort {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final SlackProperties slackProperties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void notifyVocCreated(Voc voc) {
        if (!isEnabled()) {
            log.debug("Slack notification disabled, skipping VOC created notification");
            return;
        }

        try {
            log.info("Sending Slack notification for VOC created: {}", voc.getTicketId());

            String message = buildVocCreatedMessage(voc);
            sendSlackMessage(message);

            log.info("Slack notification sent successfully for VOC: {}", voc.getTicketId());
        } catch (Exception e) {
            log.error("Failed to send Slack notification for VOC created: {}", voc.getTicketId(), e);
            // Don't throw exception to prevent transaction rollback
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
            // Don't throw exception to prevent transaction rollback
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
            // Don't throw exception to prevent transaction rollback
        }
    }

    /**
     * Build Slack message for VOC created event
     */
    private String buildVocCreatedMessage(Voc voc) {
        StringBuilder sb = new StringBuilder();
        sb.append("*[NEW VOC] ").append(voc.getTicketId()).append("*\n\n");
        sb.append("*Title:* ").append(voc.getTitle()).append("\n");
        sb.append("*Priority:* ").append(getPriorityEmoji(voc.getPriority().name())).append(" ")
                .append(voc.getPriority().name()).append("\n");
        sb.append("*Category:* ").append(voc.getCategoryId()).append("\n");
        sb.append("*Customer:* ").append(voc.getCustomerName()).append(" (")
                .append(voc.getCustomerEmail()).append(")\n");
        sb.append("*Created:* ").append(voc.getCreatedAt().format(DATE_FORMATTER)).append("\n");

        if (voc.getContent() != null && !voc.getContent().isEmpty()) {
            String preview = voc.getContent().length() > 100
                    ? voc.getContent().substring(0, 100) + "..."
                    : voc.getContent();
            sb.append("\n*Content:*\n```").append(preview).append("```");
        }

        return sb.toString();
    }

    /**
     * Build Slack message for VOC status changed event
     */
    private String buildVocStatusChangedMessage(Voc voc, String previousStatus) {
        StringBuilder sb = new StringBuilder();
        sb.append("*[STATUS CHANGED] ").append(voc.getTicketId()).append("*\n\n");
        sb.append("*Title:* ").append(voc.getTitle()).append("\n");
        sb.append("*Status Change:* ").append(previousStatus).append(" → *")
                .append(voc.getStatus().name()).append("*\n");
        sb.append("*Priority:* ").append(getPriorityEmoji(voc.getPriority().name())).append(" ")
                .append(voc.getPriority().name()).append("\n");

        if (voc.getAssigneeId() != null) {
            sb.append("*Assignee ID:* ").append(voc.getAssigneeId()).append("\n");
        }

        sb.append("*Updated:* ").append(voc.getUpdatedAt().format(DATE_FORMATTER));

        return sb.toString();
    }

    /**
     * Build Slack message for VOC assigned event
     */
    private String buildVocAssignedMessage(Voc voc, String assigneeName) {
        StringBuilder sb = new StringBuilder();
        sb.append("*[ASSIGNED] ").append(voc.getTicketId()).append("*\n\n");
        sb.append("*Title:* ").append(voc.getTitle()).append("\n");
        sb.append("*Assigned to:* @").append(assigneeName).append("\n");
        sb.append("*Priority:* ").append(getPriorityEmoji(voc.getPriority().name())).append(" ")
                .append(voc.getPriority().name()).append("\n");
        sb.append("*Status:* ").append(voc.getStatus().name()).append("\n");
        sb.append("*Assigned at:* ").append(voc.getUpdatedAt().format(DATE_FORMATTER));

        return sb.toString();
    }

    /**
     * Get priority emoji
     */
    private String getPriorityEmoji(String priority) {
        return switch (priority) {
            case "URGENT" -> "🔴";
            case "HIGH" -> "🟠";
            case "NORMAL" -> "🟡";
            case "LOW" -> "🟢";
            default -> "⚪";
        };
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
