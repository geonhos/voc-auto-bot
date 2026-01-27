package com.geonho.vocautobot.adapter.in.web.email.dto;

import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Schema(description = "이메일 발송 응답")
@Getter
@AllArgsConstructor
public class SendEmailResponse {

    @Schema(description = "이메일 로그 ID", example = "1")
    private Long id;

    @Schema(description = "수신자 이메일", example = "user@example.com")
    private String recipientEmail;

    @Schema(description = "수신자 이름", example = "홍길동")
    private String recipientName;

    @Schema(description = "이메일 제목", example = "VOC 접수 안내")
    private String subject;

    @Schema(description = "발송 상태", example = "SENT")
    private EmailStatus status;

    @Schema(description = "발송 일시", example = "2024-01-25T10:30:00")
    private LocalDateTime sentAt;

    @Schema(description = "에러 메시지", example = "null")
    private String errorMessage;

    public static SendEmailResponse from(EmailLog emailLog) {
        return new SendEmailResponse(
                emailLog.getId(),
                emailLog.getRecipientEmail(),
                emailLog.getRecipientName(),
                emailLog.getSubject(),
                emailLog.getStatus(),
                emailLog.getSentAt(),
                emailLog.getErrorMessage()
        );
    }
}
