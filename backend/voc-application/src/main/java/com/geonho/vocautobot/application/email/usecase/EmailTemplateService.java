package com.geonho.vocautobot.application.email.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.email.port.in.GetTemplateUseCase;
import com.geonho.vocautobot.application.email.port.out.LoadEmailTemplatePort;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 이메일 템플릿 조회 서비스
 */
@Service
@UseCase
@Transactional(readOnly = true)
public class EmailTemplateService implements GetTemplateUseCase {

    private final LoadEmailTemplatePort loadEmailTemplatePort;

    public EmailTemplateService(LoadEmailTemplatePort loadEmailTemplatePort) {
        this.loadEmailTemplatePort = loadEmailTemplatePort;
    }

    @Override
    public EmailTemplate getTemplateById(Long id) {
        return loadEmailTemplatePort.loadTemplateById(id)
                .orElseThrow(() -> new IllegalArgumentException("이메일 템플릿을 찾을 수 없습니다"));
    }

    @Override
    public List<EmailTemplate> getActiveTemplates() {
        return loadEmailTemplatePort.loadActiveTemplates();
    }

    @Override
    public List<EmailTemplate> getAllTemplates() {
        return loadEmailTemplatePort.loadAllTemplates();
    }
}
