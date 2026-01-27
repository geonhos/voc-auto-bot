package com.geonho.vocautobot.adapter.in.web.email.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "이메일 템플릿 생성/수정 요청")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateRequest {

    @Schema(description = "템플릿 이름", example = "VOC 접수 안내", required = true)
    @NotBlank(message = "템플릿 이름은 필수입니다")
    @Size(max = 100, message = "템플릿 이름은 최대 100자까지 입력 가능합니다")
    private String name;

    @Schema(description = "이메일 제목", example = "[VOC] {{customerName}}님의 VOC가 접수되었습니다", required = true)
    @NotBlank(message = "이메일 제목은 필수입니다")
    @Size(max = 200, message = "이메일 제목은 최대 200자까지 입력 가능합니다")
    private String subject;

    @Schema(description = "이메일 본문", example = "<p>안녕하세요 {{customerName}}님,</p><p>귀하의 VOC({{ticketNumber}})가 정상적으로 접수되었습니다.</p>", required = true)
    @NotBlank(message = "이메일 본문은 필수입니다")
    private String body;

    @Schema(description = "템플릿 변수 목록", example = "[\"customerName\", \"ticketNumber\"]")
    private List<String> variables;

    @Schema(description = "활성화 여부", example = "true")
    private boolean isActive = true;
}
