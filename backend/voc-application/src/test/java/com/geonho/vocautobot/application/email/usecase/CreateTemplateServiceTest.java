package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.common.exception.EntityNotFoundException;
import com.geonho.vocautobot.application.email.port.in.dto.CreateTemplateCommand;
import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailTemplatePort;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateTemplateService 테스트")
class CreateTemplateServiceTest {

    @Mock
    private LoadEmailTemplatePort loadEmailTemplatePort;

    @Mock
    private SaveEmailTemplatePort saveEmailTemplatePort;

    @InjectMocks
    private CreateTemplateService createTemplateService;

    @Test
    @DisplayName("이메일 템플릿 생성 성공")
    void createTemplate_shouldCreateSuccessfully() {
        List<String> variables = Arrays.asList("ticketId", "customerName");
        CreateTemplateCommand command = CreateTemplateCommand.of(
                "VOC 완료 안내",
                "[{{ticketId}}] VOC 처리 완료",
                "안녕하세요 {{customerName}}님",
                variables
        );

        EmailTemplate savedTemplate = EmailTemplate.create(
                command.getName(),
                command.getSubject(),
                command.getBody(),
                command.getVariables()
        );
        savedTemplate.setId(1L);

        given(loadEmailTemplatePort.existsByName("VOC 완료 안내")).willReturn(false);
        given(saveEmailTemplatePort.saveEmailTemplate(any(EmailTemplate.class))).willReturn(savedTemplate);

        EmailTemplate result = createTemplateService.createTemplate(command);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("VOC 완료 안내");
        verify(saveEmailTemplatePort).saveEmailTemplate(any(EmailTemplate.class));
    }

    @Test
    @DisplayName("중복된 템플릿 이름으로 생성 시 예외 발생")
    void createTemplate_shouldThrowException_whenNameAlreadyExists() {
        CreateTemplateCommand command = CreateTemplateCommand.of(
                "VOC 완료 안내",
                "제목",
                "본문",
                null
        );

        given(loadEmailTemplatePort.existsByName("VOC 완료 안내")).willReturn(true);

        assertThatThrownBy(() -> createTemplateService.createTemplate(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 존재하는 템플릿 이름입니다");
    }

    @Test
    @DisplayName("이메일 템플릿 수정 성공")
    void updateTemplate_shouldUpdateSuccessfully() {
        EmailTemplate existingTemplate = EmailTemplate.create(
                "기존 템플릿",
                "기존 제목",
                "기존 본문",
                null
        );
        existingTemplate.setId(1L);

        CreateTemplateCommand command = CreateTemplateCommand.of(
                "수정된 템플릿",
                "수정된 제목",
                "수정된 본문",
                Arrays.asList("newVar")
        );

        given(loadEmailTemplatePort.loadTemplateById(1L)).willReturn(Optional.of(existingTemplate));
        given(loadEmailTemplatePort.existsByName("수정된 템플릿")).willReturn(false);
        given(saveEmailTemplatePort.saveEmailTemplate(any(EmailTemplate.class))).willReturn(existingTemplate);

        EmailTemplate result = createTemplateService.updateTemplate(1L, command);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("수정된 템플릿");
        verify(saveEmailTemplatePort).saveEmailTemplate(any(EmailTemplate.class));
    }

    @Test
    @DisplayName("존재하지 않는 템플릿 수정 시 예외 발생")
    void updateTemplate_shouldThrowException_whenTemplateNotFound() {
        CreateTemplateCommand command = CreateTemplateCommand.of(
                "템플릿",
                "제목",
                "본문",
                null
        );

        given(loadEmailTemplatePort.loadTemplateById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> createTemplateService.updateTemplate(999L, command))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("이메일 템플릿을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("템플릿 활성화 성공")
    void activateTemplate_shouldActivateSuccessfully() {
        EmailTemplate template = EmailTemplate.create("템플릿", "제목", "본문", null);
        template.setId(1L);
        template.deactivate();

        given(loadEmailTemplatePort.loadTemplateById(1L)).willReturn(Optional.of(template));
        given(saveEmailTemplatePort.saveEmailTemplate(any(EmailTemplate.class))).willReturn(template);

        createTemplateService.activateTemplate(1L);

        assertThat(template.isActive()).isTrue();
        verify(saveEmailTemplatePort).saveEmailTemplate(template);
    }

    @Test
    @DisplayName("템플릿 비활성화 성공")
    void deactivateTemplate_shouldDeactivateSuccessfully() {
        EmailTemplate template = EmailTemplate.create("템플릿", "제목", "본문", null);
        template.setId(1L);

        given(loadEmailTemplatePort.loadTemplateById(1L)).willReturn(Optional.of(template));
        given(saveEmailTemplatePort.saveEmailTemplate(any(EmailTemplate.class))).willReturn(template);

        createTemplateService.deactivateTemplate(1L);

        assertThat(template.isActive()).isFalse();
        verify(saveEmailTemplatePort).saveEmailTemplate(template);
    }

    @Test
    @DisplayName("존재하지 않는 템플릿 활성화 시 예외 발생")
    void activateTemplate_shouldThrowException_whenTemplateNotFound() {
        given(loadEmailTemplatePort.loadTemplateById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> createTemplateService.activateTemplate(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("이메일 템플릿을 찾을 수 없습니다");
    }
}
