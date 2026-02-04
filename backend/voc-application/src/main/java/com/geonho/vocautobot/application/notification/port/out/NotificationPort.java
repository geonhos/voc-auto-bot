package com.geonho.vocautobot.application.notification.port.out;

import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Notification Port Interface
 * Defines contract for sending notifications to external systems
 */
public interface NotificationPort {

    /**
     * Send notification when a new VOC is created
     *
     * @param voc Created VOC domain model
     */
    void notifyVocCreated(VocDomain voc);

    /**
     * Send notification when VOC status changes
     *
     * @param voc VOC domain model with changed status
     * @param previousStatus Previous status before change
     */
    void notifyVocStatusChanged(VocDomain voc, String previousStatus);

    /**
     * Send notification when VOC is assigned to a user
     *
     * @param voc VOC domain model
     * @param assigneeName Name of the assigned user
     */
    void notifyVocAssigned(VocDomain voc, String assigneeName);

    /**
     * Notification send exception
     */
    class NotificationException extends RuntimeException {
        public NotificationException(String message) {
            super(message);
        }

        public NotificationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
