package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.BulkPriorityChangeCommand;
import com.geonho.vocautobot.domain.voc.VocPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "VOC 일괄 우선순위 변경 요청")
@Getter
@NoArgsConstructor
public class BulkPriorityChangeRequest {

    @Schema(description = "대상 VOC ID 목록", example = "[1, 2, 3]")
    @NotEmpty(message = "VOC ID 목록을 입력해주세요")
    @Size(max = 100, message = "한 번에 최대 100건까지 처리 가능합니다")
    private List<Long> vocIds;

    @Schema(description = "변경할 우선순위", example = "HIGH")
    @NotNull(message = "우선순위를 선택해주세요")
    private VocPriority priority;

    public BulkPriorityChangeCommand toCommand() {
        return new BulkPriorityChangeCommand(vocIds, priority);
    }
}
