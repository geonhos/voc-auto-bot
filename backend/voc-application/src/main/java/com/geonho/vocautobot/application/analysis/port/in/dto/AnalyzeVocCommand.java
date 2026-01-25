package com.geonho.vocautobot.application.analysis.port.in.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * VOC 분석 요청 Command
 */
public class AnalyzeVocCommand {

    @NotBlank(message = "VOC 제목은 필수입니다")
    private final String title;

    @NotBlank(message = "VOC 내용은 필수입니다")
    private final String content;

    private final Long customerId;

    public AnalyzeVocCommand(String title, String content, Long customerId) {
        this.title = title;
        this.content = content;
        this.customerId = customerId;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Long getCustomerId() {
        return customerId;
    }

    @Override
    public String toString() {
        return "AnalyzeVocCommand{" +
                "title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", customerId=" + customerId +
                '}';
    }
}
