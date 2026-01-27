package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.ChangeStatusCommand;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "VOC 상태 변경 요청")
@Getter
@NoArgsConstructor
public class ChangeStatusRequest {

    @Schema(description = "변경할 상태", example = "IN_PROGRESS")
    @NotNull(message = "상태를 선택해주세요")
    private VocStatus status;

    public ChangeStatusCommand toCommand(Long vocId) {
        return new ChangeStatusCommand(
                vocId,
                status
        );
    }
}
