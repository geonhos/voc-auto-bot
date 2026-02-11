package com.geonho.vocautobot.adapter.in.web.email;

import com.geonho.vocautobot.adapter.common.exception.GlobalExceptionHandler;
import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import com.geonho.vocautobot.application.email.port.in.CreateTemplateUseCase;
import com.geonho.vocautobot.application.email.port.in.GetTemplateUseCase;
import com.geonho.vocautobot.domain.email.EmailTemplate;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmailTemplateController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {"security.enabled=false"})
@DisplayName("EmailTemplateController 통합 테스트")
class EmailTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CreateTemplateUseCase createTemplateUseCase;

    @MockBean
    private GetTemplateUseCase getTemplateUseCase;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private static EmailTemplate createSampleTemplate() {
        return new EmailTemplate(
                1L, "VOC 접수 안내", "[VOC] {{customerName}}님의 VOC가 접수되었습니다",
                "<p>안녕하세요 {{customerName}}님</p>",
                List.of("customerName", "ticketNumber"),
                true, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("GET /v1/email-templates - 템플릿 목록 조회")
    class GetAllTemplates {

        @Test
        @DisplayName("전체 템플릿 목록 조회 성공")
        void shouldReturnAllTemplates() throws Exception {
            EmailTemplate template = createSampleTemplate();
            given(getTemplateUseCase.getAllTemplates()).willReturn(List.of(template));

            mockMvc.perform(get("/v1/email-templates"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("VOC 접수 안내"));
        }
    }

    @Nested
    @DisplayName("GET /v1/email-templates/active - 활성 템플릿 조회")
    class GetActiveTemplates {

        @Test
        @DisplayName("활성 템플릿 목록 조회 성공")
        void shouldReturnActiveTemplates() throws Exception {
            EmailTemplate template = createSampleTemplate();
            given(getTemplateUseCase.getActiveTemplates()).willReturn(List.of(template));

            mockMvc.perform(get("/v1/email-templates/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].active").value(true));
        }
    }

    @Nested
    @DisplayName("GET /v1/email-templates/{id} - 템플릿 상세 조회")
    class GetTemplate {

        @Test
        @DisplayName("템플릿 상세 조회 성공")
        void shouldReturnTemplateById() throws Exception {
            EmailTemplate template = createSampleTemplate();
            given(getTemplateUseCase.getTemplateById(1L)).willReturn(template);

            mockMvc.perform(get("/v1/email-templates/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("VOC 접수 안내"))
                    .andExpect(jsonPath("$.data.variables").isArray());
        }
    }

    @Nested
    @DisplayName("POST /v1/email-templates - 템플릿 생성")
    class CreateTemplate {

        @Test
        @DisplayName("템플릿 생성 성공")
        void shouldCreateTemplateSuccessfully() throws Exception {
            EmailTemplate template = createSampleTemplate();
            given(createTemplateUseCase.createTemplate(any())).willReturn(template);

            String requestBody = """
                    {
                        "name": "VOC 접수 안내",
                        "subject": "[VOC] {{customerName}}님의 VOC가 접수되었습니다",
                        "body": "<p>안녕하세요 {{customerName}}님</p>",
                        "variables": ["customerName", "ticketNumber"]
                    }
                    """;

            mockMvc.perform(post("/v1/email-templates")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("VOC 접수 안내"));
        }

        @Test
        @DisplayName("이름 누락 시 400 에러")
        void shouldReturn400WhenNameMissing() throws Exception {
            String requestBody = """
                    {
                        "subject": "제목",
                        "body": "본문"
                    }
                    """;

            mockMvc.perform(post("/v1/email-templates")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("PUT /v1/email-templates/{id} - 템플릿 수정")
    class UpdateTemplate {

        @Test
        @DisplayName("템플릿 수정 성공")
        void shouldUpdateTemplateSuccessfully() throws Exception {
            EmailTemplate updated = new EmailTemplate(
                    1L, "수정된 템플릿", "[수정] 제목",
                    "수정된 본문", List.of("var1"),
                    true, LocalDateTime.now(), LocalDateTime.now()
            );
            given(createTemplateUseCase.updateTemplate(anyLong(), any())).willReturn(updated);

            String requestBody = """
                    {
                        "name": "수정된 템플릿",
                        "subject": "[수정] 제목",
                        "body": "수정된 본문",
                        "variables": ["var1"]
                    }
                    """;

            mockMvc.perform(put("/v1/email-templates/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("수정된 템플릿"));
        }
    }

    @Nested
    @DisplayName("PATCH /v1/email-templates/{id}/activate - 템플릿 활성화")
    class ActivateTemplate {

        @Test
        @DisplayName("템플릿 활성화 성공")
        void shouldActivateTemplate() throws Exception {
            doNothing().when(createTemplateUseCase).activateTemplate(1L);

            mockMvc.perform(patch("/v1/email-templates/1/activate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("PATCH /v1/email-templates/{id}/deactivate - 템플릿 비활성화")
    class DeactivateTemplate {

        @Test
        @DisplayName("템플릿 비활성화 성공")
        void shouldDeactivateTemplate() throws Exception {
            doNothing().when(createTemplateUseCase).deactivateTemplate(1L);

            mockMvc.perform(patch("/v1/email-templates/1/deactivate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
