package com.geonho.vocautobot.adapter.out.notification;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Slack Configuration Properties
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "slack")
public class SlackProperties {

    /**
     * Slack Webhook URL for sending notifications
     */
    private String webhookUrl;

    /**
     * Enable/disable Slack notifications
     */
    private boolean enabled = true;

    /**
     * Channel name (optional, for display purposes)
     */
    private String channel;

    /**
     * Bot username (optional)
     */
    private String username = "VOC Auto Bot";

    /**
     * Bot icon emoji (optional)
     */
    private String iconEmoji = ":bell:";
}
