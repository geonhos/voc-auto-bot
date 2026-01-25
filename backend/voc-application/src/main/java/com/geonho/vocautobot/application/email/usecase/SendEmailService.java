package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.email.port.in.SendEmailUseCase;
import com.geonho.vocautobot.application.email.port.in.dto.SendEmailCommand;
import com.geonho.vocautobot.application.email.port.out.EmailPort;
import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailLogPort;
import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일 발송 서비스
 */
@Service
@UseCase
@Transactional
public class SendEmailService implements SendEmailUseCase {

    private final EmailPort emailPort;
    private final LoadEmailTemplatePort loadEmailTemplatePort;
    private final SaveEmailLogPort saveEmailLogPort;

    public SendEmailService(EmailPort emailPort,
                           LoadEmailTemplatePort loadEmailTemplatePort,
                           SaveEmailLogPort saveEmailLogPort) {
        this.emailPort = emailPort;
        this.loadEmailTemplatePort = loadEmailTemplatePort;
        this.saveEmailLogPort = saveEmailLogPort;
    }

    @Override
    public EmailLog sendEmail(SendEmailCommand command) {
        String subject;
        String body;
        Long templateId = null;

        if (command.isTemplateEmail()) {
            // 템플릿 기반 이메일
            EmailTemplate template = loadEmailTemplatePort.loadTemplateById(command.getTemplateId())
                    .orElseThrow(() -> new IllegalArgumentException("이메일 템플릿을 찾을 수 없습니다"));

            if (!template.isActive()) {
                throw new IllegalArgumentException("비활성화된 템플릿입니다");
            }

            subject = template.getResolvedSubject(command.getVariables());
            body = template.getResolvedBody(command.getVariables());
            templateId = template.getId();
        } else {
            // 직접 작성한 이메일
            subject = command.getSubject();
            body = command.getBody();
        }

        // 이메일 로그 생성
        EmailLog emailLog = EmailLog.create(
                templateId,
                command.getRecipientEmail(),
                command.getRecipientName(),
                subject,
                body
        );

        // 이메일 로그 저장 (발송 전)
        emailLog = saveEmailLogPort.saveEmailLog(emailLog);

        try {
            // 실제 이메일 발송
            emailPort.sendEmail(
                    command.getRecipientEmail(),
                    command.getRecipientName(),
                    subject,
                    body
            );

            // 발송 성공 처리
            emailLog.markAsSent();
        } catch (EmailPort.EmailSendException e) {
            // 발송 실패 처리
            emailLog.markAsFailed(e.getMessage());
        }

        // 최종 상태 저장
        return saveEmailLogPort.saveEmailLog(emailLog);
    }
}
