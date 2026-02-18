package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.BulkStatusChangeCommand;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "VOC 일괄 상태 변경 요청")
@Getter
@NoArgsConstructor
public class BulkStatusChangeRequest {

    @Schema(description = "대상 VOC ID 목록", example = "[1, 2, 3]")
    @NotEmpty(message = "VOC ID 목록을 입력해주세요")
    @Size(max = 100, message = "한 번에 최대 100건까지 처리 가능합니다")
    private List<Long> vocIds;

    @Schema(description = "변경할 상태", example = "IN_PROGRESS")
    @NotNull(message = "상태를 선택해주세요")
    private VocStatus status;

    @Schema(description = "변경 사유", example = "일괄 처리")
    private String reason;

    public BulkStatusChangeCommand toCommand() {
        return new BulkStatusChangeCommand(vocIds, status, reason);
    }
}
