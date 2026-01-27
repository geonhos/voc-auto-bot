package com.geonho.vocautobot.adapter.in.web.email;

import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.web.email.dto.EmailTemplateRequest;
import com.geonho.vocautobot.adapter.in.web.email.dto.EmailTemplateResponse;
import com.geonho.vocautobot.application.email.port.in.CreateTemplateUseCase;
import com.geonho.vocautobot.application.email.port.in.GetTemplateUseCase;
import com.geonho.vocautobot.application.email.port.in.dto.CreateTemplateCommand;
import com.geonho.vocautobot.domain.email.EmailTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Email Template", description = "이메일 템플릿 관리 API")
@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final CreateTemplateUseCase createTemplateUseCase;
    private final GetTemplateUseCase getTemplateUseCase;

    @Operation(summary = "이메일 템플릿 목록 조회", description = "모든 이메일 템플릿 목록을 조회합니다")
    @GetMapping
    public ApiResponse<List<EmailTemplateResponse>> getAllTemplates() {
        List<EmailTemplate> templates = getTemplateUseCase.getAllTemplates();
        List<EmailTemplateResponse> response = templates.stream()
                .map(EmailTemplateResponse::from)
                .collect(Collectors.toList());

        return ApiResponse.success(response);
    }

    @Operation(summary = "활성 이메일 템플릿 목록 조회", description = "활성화된 이메일 템플릿 목록을 조회합니다")
    @GetMapping("/active")
    public ApiResponse<List<EmailTemplateResponse>> getActiveTemplates() {
        List<EmailTemplate> templates = getTemplateUseCase.getActiveTemplates();
        List<EmailTemplateResponse> response = templates.stream()
                .map(EmailTemplateResponse::from)
                .collect(Collectors.toList());

        return ApiResponse.success(response);
    }

    @Operation(summary = "이메일 템플릿 상세 조회", description = "ID로 특정 이메일 템플릿을 조회합니다")
    @GetMapping("/{id}")
    public ApiResponse<EmailTemplateResponse> getTemplate(@PathVariable Long id) {
        EmailTemplate template = getTemplateUseCase.getTemplateById(id);
        EmailTemplateResponse response = EmailTemplateResponse.from(template);

        return ApiResponse.success(response);
    }

    @Operation(summary = "이메일 템플릿 생성", description = "새로운 이메일 템플릿을 생성합니다 (ADMIN 권한 필요)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmailTemplateResponse> createTemplate(@Valid @RequestBody EmailTemplateRequest request) {
        CreateTemplateCommand command = CreateTemplateCommand.of(
                request.getName(),
                request.getSubject(),
                request.getBody(),
                request.getVariables()
        );

        EmailTemplate template = createTemplateUseCase.createTemplate(command);
        EmailTemplateResponse response = EmailTemplateResponse.from(template);

        return ApiResponse.success(response);
    }

    @Operation(summary = "이메일 템플릿 수정", description = "기존 이메일 템플릿 정보를 수정합니다 (ADMIN 권한 필요)")
    @PutMapping("/{id}")
    public ApiResponse<EmailTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody EmailTemplateRequest request) {
        CreateTemplateCommand command = CreateTemplateCommand.of(
                request.getName(),
                request.getSubject(),
                request.getBody(),
                request.getVariables()
        );

        EmailTemplate template = createTemplateUseCase.updateTemplate(id, command);
        EmailTemplateResponse response = EmailTemplateResponse.from(template);

        return ApiResponse.success(response);
    }

    @Operation(summary = "이메일 템플릿 활성화", description = "이메일 템플릿을 활성화합니다 (ADMIN 권한 필요)")
    @PatchMapping("/{id}/activate")
    public ApiResponse<Void> activateTemplate(@PathVariable Long id) {
        createTemplateUseCase.activateTemplate(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "이메일 템플릿 비활성화", description = "이메일 템플릿을 비활성화합니다 (ADMIN 권한 필요)")
    @PatchMapping("/{id}/deactivate")
    public ApiResponse<Void> deactivateTemplate(@PathVariable Long id) {
        createTemplateUseCase.deactivateTemplate(id);
        return ApiResponse.success(null);
    }
}
