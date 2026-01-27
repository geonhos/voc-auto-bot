package com.geonho.vocautobot.adapter.in.web.email.dto;

import com.geonho.vocautobot.domain.email.EmailTemplate;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "이메일 템플릿 응답")
@Getter
@AllArgsConstructor
public class EmailTemplateResponse {

    @Schema(description = "템플릿 ID", example = "1")
    private Long id;

    @Schema(description = "템플릿 이름", example = "VOC 접수 안내")
    private String name;

    @Schema(description = "이메일 제목", example = "[VOC] {{customerName}}님의 VOC가 접수되었습니다")
    private String subject;

    @Schema(description = "이메일 본문")
    private String body;

    @Schema(description = "템플릿 변수 목록", example = "[\"customerName\", \"ticketNumber\"]")
    private List<String> variables;

    @Schema(description = "활성화 여부", example = "true")
    private boolean isActive;

    @Schema(description = "생성일시", example = "2024-01-25T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "수정일시", example = "2024-01-25T10:30:00")
    private LocalDateTime updatedAt;

    public static EmailTemplateResponse from(EmailTemplate template) {
        return new EmailTemplateResponse(
                template.getId(),
                template.getName(),
                template.getSubject(),
                template.getBody(),
                template.getVariables(),
                template.isActive(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
