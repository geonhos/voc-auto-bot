package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.email.port.in.dto.SendEmailCommand;
import com.geonho.vocautobot.application.email.port.out.EmailPort;
import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailLogPort;
import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SendEmailService 테스트")
class SendEmailServiceTest {

    @Mock
    private EmailPort emailPort;

    @Mock
    private LoadEmailTemplatePort loadEmailTemplatePort;

    @Mock
    private SaveEmailLogPort saveEmailLogPort;

    @InjectMocks
    private SendEmailService sendEmailService;

    private EmailTemplate mockTemplate;
    private EmailLog mockEmailLog;

    @BeforeEach
    void setUp() {
        mockTemplate = EmailTemplate.create(
                "VOC 완료 안내",
                "[{{ticketId}}] VOC 처리 완료",
                "{{title}} 건이 처리 완료되었습니다.",
                Arrays.asList("ticketId", "title")
        );
        mockTemplate.setId(1L);

        mockEmailLog = EmailLog.create(
                1L,
                "user@example.com",
                "홍길동",
                "[VOC-20260125-00001] VOC 처리 완료",
                "결제 오류 건이 처리 완료되었습니다."
        );
        mockEmailLog.setId(1L);
    }

    @Test
    @DisplayName("템플릿 기반 이메일 발송 성공")
    void sendEmail_shouldSendSuccessfully_whenUsingTemplate() {
        Map<String, String> variables = new HashMap<>();
        variables.put("ticketId", "VOC-20260125-00001");
        variables.put("title", "결제 오류");

        SendEmailCommand command = SendEmailCommand.withTemplate(
                1L,
                "user@example.com",
                "홍길동",
                variables
        );

        given(loadEmailTemplatePort.loadTemplateById(1L)).willReturn(Optional.of(mockTemplate));
        given(saveEmailLogPort.saveEmailLog(any(EmailLog.class))).willReturn(mockEmailLog);
        doNothing().when(emailPort).sendEmail(any(), any(), any(), any());

        EmailLog result = sendEmailService.sendEmail(command);

        assertThat(result).isNotNull();
        verify(emailPort).sendEmail(any(), any(), any(), any());
        verify(saveEmailLogPort, times(2)).saveEmailLog(any(EmailLog.class));
    }

    @Test
    @DisplayName("직접 작성 이메일 발송 성공")
    void sendEmail_shouldSendSuccessfully_whenUsingDirectContent() {
        SendEmailCommand command = SendEmailCommand.withContent(
                "user@example.com",
                "홍길동",
                "테스트 제목",
                "테스트 본문"
        );

        EmailLog directEmailLog = EmailLog.create(
                null,
                "user@example.com",
                "홍길동",
                "테스트 제목",
                "테스트 본문"
        );
        directEmailLog.setId(2L);

        given(saveEmailLogPort.saveEmailLog(any(EmailLog.class))).willReturn(directEmailLog);
        doNothing().when(emailPort).sendEmail(any(), any(), any(), any());

        EmailLog result = sendEmailService.sendEmail(command);

        assertThat(result).isNotNull();
        verify(loadEmailTemplatePort, never()).loadTemplateById(any());
    }
}
