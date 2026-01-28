package com.geonho.vocautobot.adapter.out.notification;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.service.AsyncVocAnalysisService.ExtendedNotificationPort;
import com.geonho.vocautobot.domain.voc.Voc;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * No-operation notification adapter
 * Used when Slack notifications are disabled
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "slack", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoOpNotificationAdapter implements ExtendedNotificationPort {

    @Override
    public void notifyVocCreated(Voc voc) {
        log.debug("Slack notifications disabled, skipping VOC created notification for: {}", voc.getTicketId());
    }

    @Override
    public void notifyVocCreatedWithAnalysis(Voc voc, VocLogAnalysis analysis) {
        log.debug("Slack notifications disabled, skipping VOC created notification with analysis for: {}", voc.getTicketId());
    }

    @Override
    public void notifyVocCreatedWithError(Voc voc, String errorMessage) {
        log.debug("Slack notifications disabled, skipping VOC created notification with error for: {}", voc.getTicketId());
    }

    @Override
    public void notifyVocStatusChanged(Voc voc, String previousStatus) {
        log.debug("Slack notifications disabled, skipping VOC status changed notification for: {}", voc.getTicketId());
    }

    @Override
    public void notifyVocAssigned(Voc voc, String assigneeName) {
        log.debug("Slack notifications disabled, skipping VOC assigned notification for: {}", voc.getTicketId());
    }
}
