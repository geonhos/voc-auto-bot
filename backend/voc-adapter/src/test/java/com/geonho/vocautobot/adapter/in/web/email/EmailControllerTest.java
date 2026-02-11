package com.geonho.vocautobot.adapter.in.web.email;

import com.geonho.vocautobot.adapter.common.exception.GlobalExceptionHandler;
import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import com.geonho.vocautobot.application.email.port.in.SendEmailUseCase;
import com.geonho.vocautobot.domain.email.EmailLog;
import com.geonho.vocautobot.domain.email.EmailStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmailController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {"security.enabled=false"})
@DisplayName("EmailController 통합 테스트")
class EmailControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SendEmailUseCase sendEmailUseCase;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Nested
    @DisplayName("POST /v1/emails - 이메일 발송")
    class SendEmail {

        @Test
        @DisplayName("직접 작성 이메일 발송 성공")
        void shouldSendDirectEmailSuccessfully() throws Exception {
            EmailLog emailLog = new EmailLog(
                    1L, null, "user@example.com", "홍길동",
                    "VOC 접수 안내", "귀하의 VOC가 접수되었습니다.",
                    EmailStatus.SENT, LocalDateTime.now(), null, LocalDateTime.now()
            );
            given(sendEmailUseCase.sendEmail(any())).willReturn(emailLog);

            String requestBody = """
                    {
                        "recipientEmail": "user@example.com",
                        "recipientName": "홍길동",
                        "subject": "VOC 접수 안내",
                        "body": "귀하의 VOC가 접수되었습니다."
                    }
                    """;

            mockMvc.perform(post("/v1/emails")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.recipientEmail").value("user@example.com"))
                    .andExpect(jsonPath("$.data.status").value("SENT"));
        }

        @Test
        @DisplayName("템플릿 기반 이메일 발송 성공")
        void shouldSendTemplateEmailSuccessfully() throws Exception {
            EmailLog emailLog = new EmailLog(
                    1L, 1L, "user@example.com", "홍길동",
                    "[VOC] 홍길동님의 VOC가 접수되었습니다", "접수되었습니다.",
                    EmailStatus.SENT, LocalDateTime.now(), null, LocalDateTime.now()
            );
            given(sendEmailUseCase.sendEmail(any())).willReturn(emailLog);

            String requestBody = """
                    {
                        "templateId": 1,
                        "recipientEmail": "user@example.com",
                        "recipientName": "홍길동",
                        "variables": {
                            "customerName": "홍길동",
                            "ticketNumber": "VOC-2026-001"
                        }
                    }
                    """;

            mockMvc.perform(post("/v1/emails")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1));
        }

        @Test
        @DisplayName("수신자 이메일 누락 시 400 에러")
        void shouldReturn400WhenRecipientEmailMissing() throws Exception {
            String requestBody = """
                    {
                        "subject": "제목",
                        "body": "본문"
                    }
                    """;

            mockMvc.perform(post("/v1/emails")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("잘못된 이메일 형식으로 400 에러")
        void shouldReturn400WhenInvalidRecipientEmail() throws Exception {
            String requestBody = """
                    {
                        "recipientEmail": "invalid-email",
                        "subject": "제목",
                        "body": "본문"
                    }
                    """;

            mockMvc.perform(post("/v1/emails")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
