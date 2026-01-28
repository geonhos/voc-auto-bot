package com.geonho.vocautobot.application.notification.port.out;

import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Notification Port Interface
 * Defines contract for sending notifications to external systems
 */
public interface NotificationPort {

    /**
     * Send notification when a new VOC is created
     *
     * @param voc Created VOC entity
     */
    void notifyVocCreated(Voc voc);

    /**
     * Send notification when VOC status changes
     *
     * @param voc VOC entity with changed status
     * @param previousStatus Previous status before change
     */
    void notifyVocStatusChanged(Voc voc, String previousStatus);

    /**
     * Send notification when VOC is assigned to a user
     *
     * @param voc VOC entity
     * @param assigneeName Name of the assigned user
     */
    void notifyVocAssigned(Voc voc, String assigneeName);

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
