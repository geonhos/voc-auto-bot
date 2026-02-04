package com.geonho.vocautobot.adapter.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for notification-related beans.
 * Provides ObjectMapper for SlackNotificationAdapter.
 *
 * Note: RestTemplate beans are defined in RestTemplateConfig.
 */
@Configuration
public class NotificationConfig {

    /**
     * ObjectMapper bean for JSON serialization.
     * Includes JavaTimeModule for proper serialization of Java 8 date/time types.
     * Only created if no other ObjectMapper bean exists (Spring Boot auto-configures one).
     */
    @Bean
    @ConditionalOnMissingBean(ObjectMapper.class)
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
