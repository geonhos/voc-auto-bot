package com.geonho.vocautobot.adapter.in.web.email.dto;

import com.geonho.vocautobot.application.email.port.in.dto.SendEmailCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Schema(description = "이메일 발송 요청")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequest {

    @Schema(description = "템플릿 ID (템플릿 기반 발송 시 사용)", example = "1")
    private Long templateId;

    @Schema(description = "수신자 이메일", example = "user@example.com", required = true)
    @NotBlank(message = "수신자 이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String recipientEmail;

    @Schema(description = "수신자 이름", example = "홍길동")
    private String recipientName;

    @Schema(description = "이메일 제목 (직접 발송 시 사용)", example = "VOC 접수 안내")
    @Size(max = 200, message = "제목은 최대 200자까지 입력 가능합니다")
    private String subject;

    @Schema(description = "이메일 본문 (직접 발송 시 사용)", example = "VOC가 정상적으로 접수되었습니다.")
    private String body;

    @Schema(description = "템플릿 변수 (템플릿 기반 발송 시 사용)", example = "{\"customerName\": \"홍길동\", \"ticketNumber\": \"VOC-2024-001\"}")
    private Map<String, String> variables;

    public SendEmailCommand toCommand() {
        if (templateId != null) {
            return SendEmailCommand.withTemplate(
                    templateId,
                    recipientEmail,
                    recipientName,
                    variables
            );
        } else {
            return SendEmailCommand.withContent(
                    recipientEmail,
                    recipientName,
                    subject,
                    body
            );
        }
    }
}
