package com.geonho.vocautobot.adapter.out.email;

import com.geonho.vocautobot.application.email.port.out.EmailPort;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;

/**
 * SMTP 이메일 발송 Adapter
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpEmailAdapter implements EmailPort {

    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;

    @Override
    public void sendEmail(String recipientEmail, String recipientName, String subject, String body)
            throws EmailSendException {
        try {
            log.info("Sending email to: {} ({})", recipientEmail, recipientName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set sender
            String fromEmail = emailProperties.getFrom() != null
                    ? emailProperties.getFrom()
                    : emailProperties.getUsername();
            String fromName = emailProperties.getFromName() != null
                    ? emailProperties.getFromName()
                    : "VOC Auto Bot";

            try {
                helper.setFrom(fromEmail, fromName);
            } catch (UnsupportedEncodingException e) {
                throw new EmailSendException("발신자 정보 설정 실패", e);
            }

            // Set recipient
            if (recipientName != null && !recipientName.isEmpty()) {
                helper.setTo(recipientEmail);
            } else {
                helper.setTo(recipientEmail);
            }

            // Set subject and body
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML content

            // Send email
            mailSender.send(message);

            log.info("Email sent successfully to: {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", recipientEmail, e);
            throw new EmailSendException("이메일 발송에 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error while sending email to: {}", recipientEmail, e);
            throw new EmailSendException("이메일 발송 중 예기치 않은 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
