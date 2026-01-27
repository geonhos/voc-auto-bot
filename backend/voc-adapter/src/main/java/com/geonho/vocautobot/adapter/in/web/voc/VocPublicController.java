package com.geonho.vocautobot.adapter.in.web.voc;

import com.geonho.vocautobot.adapter.in.web.voc.dto.VocStatusResponse;
import com.geonho.vocautobot.application.voc.port.in.GetVocDetailUseCase;
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.adapter.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Public VOC inquiry REST controller (no authentication required)
 */
@Tag(name = "VOC Public", description = "VOC 공개 조회 API (인증 불필요)")
@RestController
@RequestMapping("/v1/public/vocs")
@RequiredArgsConstructor
@Validated
public class VocPublicController {

    private final GetVocDetailUseCase getVocDetailUseCase;

    @Operation(
            summary = "VOC 상태 조회 (공개)",
            description = "티켓 ID와 고객 이메일로 VOC 상태를 조회합니다. 인증이 필요하지 않습니다."
    )
    @GetMapping("/status")
    public ApiResponse<VocStatusResponse> getVocStatus(
            @Parameter(description = "티켓 ID", example = "VOC-20260125-0001", required = true)
            @RequestParam
            @NotBlank(message = "티켓 ID를 입력해주세요")
            String ticketId,

            @Parameter(description = "고객 이메일", example = "customer@example.com", required = true)
            @RequestParam
            @NotBlank(message = "이메일을 입력해주세요")
            @Email(message = "올바른 이메일 형식이 아닙니다")
            String email
    ) {
        Voc voc = getVocDetailUseCase.getVocByTicketId(ticketId);

        // Verify that the email matches the customer email
        if (!voc.getCustomerEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("티켓 ID와 이메일이 일치하지 않습니다");
        }

        VocStatusResponse response = VocStatusResponse.from(voc);
        return ApiResponse.success(response);
    }
}
