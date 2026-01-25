package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailTemplateService 테스트")
class EmailTemplateServiceTest {

    @Mock
    private LoadEmailTemplatePort loadEmailTemplatePort;

    @InjectMocks
    private EmailTemplateService emailTemplateService;

    @Test
    @DisplayName("ID로 템플릿 조회 성공")
    void getTemplateById_shouldReturnTemplate_whenExists() {
        EmailTemplate template = EmailTemplate.create("템플릿", "제목", "본문", null);
        template.setId(1L);

        given(loadEmailTemplatePort.loadTemplateById(1L)).willReturn(Optional.of(template));

        EmailTemplate result = emailTemplateService.getTemplateById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("활성화된 템플릿 목록 조회")
    void getActiveTemplates_shouldReturnActiveTemplates() {
        List<EmailTemplate> templates = Arrays.asList(
                EmailTemplate.create("템플릿1", "제목1", "본문1", null),
                EmailTemplate.create("템플릿2", "제목2", "본문2", null)
        );

        given(loadEmailTemplatePort.loadActiveTemplates()).willReturn(templates);

        List<EmailTemplate> result = emailTemplateService.getActiveTemplates();

        assertThat(result).hasSize(2);
    }
}
