package com.geonho.vocautobot.domain.email;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 이메일 템플릿 도메인 엔티티
 */
public class EmailTemplate {

    private Long id;
    private String name;
    private String subject;
    private String body;
    private List<String> variables;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmailTemplate(Long id, String name, String subject, String body,
                        List<String> variables, boolean isActive,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        validateName(name);
        validateSubject(subject);
        validateBody(body);

        this.id = id;
        this.name = name;
        this.subject = subject;
        this.body = body;
        this.variables = variables != null ? new ArrayList<>(variables) : new ArrayList<>();
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static EmailTemplate create(String name, String subject, String body, List<String> variables) {
        return new EmailTemplate(null, name, subject, body, variables, true, null, null);
    }

    public void update(String name, String subject, String body, List<String> variables) {
        if (name != null) {
            validateName(name);
            this.name = name;
        }
        if (subject != null) {
            validateSubject(subject);
            this.subject = subject;
        }
        if (body != null) {
            validateBody(body);
            this.body = body;
        }
        if (variables != null) {
            this.variables = new ArrayList<>(variables);
        }
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    /**
     * 템플릿 변수를 실제 값으로 치환
     */
    public String replaceVariables(String text, java.util.Map<String, String> values) {
        if (text == null || values == null) {
            return text;
        }

        String result = text;
        for (java.util.Map.Entry<String, String> entry : values.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }

    /**
     * 템플릿 변수가 치환된 제목 반환
     */
    public String getResolvedSubject(java.util.Map<String, String> values) {
        return replaceVariables(this.subject, values);
    }

    /**
     * 템플릿 변수가 치환된 본문 반환
     */
    public String getResolvedBody(java.util.Map<String, String> values) {
        return replaceVariables(this.body, values);
    }

    private void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("템플릿 이름은 필수입니다");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("템플릿 이름은 최대 100자까지 입력 가능합니다");
        }
    }

    private void validateSubject(String subject) {
        if (subject == null || subject.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 제목은 필수입니다");
        }
        if (subject.length() > 200) {
            throw new IllegalArgumentException("이메일 제목은 최대 200자까지 입력 가능합니다");
        }
    }

    private void validateBody(String body) {
        if (body == null || body.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 본문은 필수입니다");
        }
    }

    // Getters
    public Long getId() {
        return id;
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
        return new ArrayList<>(variables);
    }

    public boolean isActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // For infrastructure layer
    public void setId(Long id) {
        this.id = id;
    }
}
