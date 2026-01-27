package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.AssignVocCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "VOC 담당자 배정 요청")
@Getter
@NoArgsConstructor
public class AssignRequest {

    @Schema(description = "담당자 ID", example = "5")
    @NotNull(message = "담당자를 선택해주세요")
    private Long assigneeId;

    public AssignVocCommand toCommand(Long vocId) {
        return new AssignVocCommand(
                vocId,
                assigneeId
        );
    }
}
