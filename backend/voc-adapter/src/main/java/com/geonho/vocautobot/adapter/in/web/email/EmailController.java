package com.geonho.vocautobot.adapter.in.web.email;

import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.web.email.dto.SendEmailRequest;
import com.geonho.vocautobot.adapter.in.web.email.dto.SendEmailResponse;
import com.geonho.vocautobot.application.email.port.in.SendEmailUseCase;
import com.geonho.vocautobot.domain.email.EmailLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Email", description = "이메일 발송 API")
@RestController
@RequestMapping("/api/v1/emails")
@RequiredArgsConstructor
public class EmailController {

    private final SendEmailUseCase sendEmailUseCase;

    @Operation(
            summary = "이메일 발송",
            description = "템플릿 기반 또는 직접 작성한 이메일을 발송합니다. " +
                    "템플릿 기반 발송 시 templateId와 variables를 사용하고, " +
                    "직접 발송 시 subject와 body를 사용합니다."
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SendEmailResponse> sendEmail(@Valid @RequestBody SendEmailRequest request) {
        EmailLog emailLog = sendEmailUseCase.sendEmail(request.toCommand());
        SendEmailResponse response = SendEmailResponse.from(emailLog);

        return ApiResponse.success(response);
    }
}
