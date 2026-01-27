package com.geonho.vocautobot.application.email.port.in.dto;

import java.util.List;

/**
 * 이메일 템플릿 생성/수정 Command
 */
public class CreateTemplateCommand {

    private final String name;
    private final String subject;
    private final String body;
    private final List<String> variables;

    private CreateTemplateCommand(String name, String subject, String body, List<String> variables) {
        this.name = name;
        this.subject = subject;
        this.body = body;
        this.variables = variables;
    }

    public static CreateTemplateCommand of(String name, String subject, String body, List<String> variables) {
        return new CreateTemplateCommand(name, subject, body, variables);
    }

    public String getName() {
        return name;
    }

    public String getSubject() {
        return subject;
    }

    public String getBody() {
        return body;
    }

    public List<String> getVariables() {
        return variables;
    }
}
