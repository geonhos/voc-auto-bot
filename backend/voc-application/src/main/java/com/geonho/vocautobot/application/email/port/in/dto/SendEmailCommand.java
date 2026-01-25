package com.geonho.vocautobot.application.email.port.in.dto;

import java.util.Map;

/**
 * 이메일 발송 Command
 */
public class SendEmailCommand {

    private final Long templateId;
    private final String recipientEmail;
    private final String recipientName;
    private final String subject;
    private final String body;
    private final Map<String, String> variables;

    private SendEmailCommand(Long templateId, String recipientEmail, String recipientName,
                            String subject, String body, Map<String, String> variables) {
        this.templateId = templateId;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.subject = subject;
        this.body = body;
        this.variables = variables;
    }

    /**
     * 템플릿 기반 이메일 발송
     */
    public static SendEmailCommand withTemplate(Long templateId, String recipientEmail,
                                               String recipientName, Map<String, String> variables) {
        return new SendEmailCommand(templateId, recipientEmail, recipientName, null, null, variables);
    }

    /**
     * 직접 작성한 이메일 발송
     */
    public static SendEmailCommand withContent(String recipientEmail, String recipientName,
                                              String subject, String body) {
        return new SendEmailCommand(null, recipientEmail, recipientName, subject, body, null);
    }

    public boolean isTemplateEmail() {
        return templateId != null;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public String getSubject() {
        return subject;
    }

    public String getBody() {
        return body;
    }

    public Map<String, String> getVariables() {
        return variables;
    }
}
