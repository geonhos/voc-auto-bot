package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.EntityNotFoundException;
import com.geonho.vocautobot.application.email.port.in.CreateTemplateUseCase;
import com.geonho.vocautobot.application.email.port.in.dto.CreateTemplateCommand;
import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.application.email.port.out.SaveEmailTemplatePort;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일 템플릿 생성/수정 서비스
 */
@Service
@UseCase
@Transactional
public class CreateTemplateService implements CreateTemplateUseCase {

    private final LoadEmailTemplatePort loadEmailTemplatePort;
    private final SaveEmailTemplatePort saveEmailTemplatePort;

    public CreateTemplateService(LoadEmailTemplatePort loadEmailTemplatePort,
                                SaveEmailTemplatePort saveEmailTemplatePort) {
        this.loadEmailTemplatePort = loadEmailTemplatePort;
        this.saveEmailTemplatePort = saveEmailTemplatePort;
    }

    @Override
    public EmailTemplate createTemplate(CreateTemplateCommand command) {
        // 중복 이름 체크
        if (loadEmailTemplatePort.existsByName(command.getName())) {
            throw new IllegalArgumentException("이미 존재하는 템플릿 이름입니다: " + command.getName());
        }

        EmailTemplate template = EmailTemplate.create(
                command.getName(),
                command.getSubject(),
                command.getBody(),
                command.getVariables()
        );

        return saveEmailTemplatePort.saveEmailTemplate(template);
    }

    @Override
    public EmailTemplate updateTemplate(Long id, CreateTemplateCommand command) {
        EmailTemplate template = loadEmailTemplatePort.loadTemplateById(id)
                .orElseThrow(() -> new EntityNotFoundException("이메일 템플릿을 찾을 수 없습니다: " + id));

        // 이름 변경 시 중복 체크
        if (!template.getName().equals(command.getName()) &&
                loadEmailTemplatePort.existsByName(command.getName())) {
            throw new IllegalArgumentException("이미 존재하는 템플릿 이름입니다: " + command.getName());
        }

        template.update(
                command.getName(),
                command.getSubject(),
                command.getBody(),
                command.getVariables()
        );

        return saveEmailTemplatePort.saveEmailTemplate(template);
    }

    @Override
    public void activateTemplate(Long id) {
        EmailTemplate template = loadEmailTemplatePort.loadTemplateById(id)
                .orElseThrow(() -> new EntityNotFoundException("이메일 템플릿을 찾을 수 없습니다: " + id));

        template.activate();
        saveEmailTemplatePort.saveEmailTemplate(template);
    }

    @Override
    public void deactivateTemplate(Long id) {
        EmailTemplate template = loadEmailTemplatePort.loadTemplateById(id)
                .orElseThrow(() -> new EntityNotFoundException("이메일 템플릿을 찾을 수 없습니다: " + id));

        template.deactivate();
        saveEmailTemplatePort.saveEmailTemplate(template);
    }
}
