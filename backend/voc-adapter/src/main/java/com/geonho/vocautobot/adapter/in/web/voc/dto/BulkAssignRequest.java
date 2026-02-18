package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.BulkAssignCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "VOC 일괄 담당자 배정 요청")
@Getter
@NoArgsConstructor
public class BulkAssignRequest {

    @Schema(description = "대상 VOC ID 목록", example = "[1, 2, 3]")
    @NotEmpty(message = "VOC ID 목록을 입력해주세요")
    @Size(max = 100, message = "한 번에 최대 100건까지 처리 가능합니다")
    private List<Long> vocIds;

    @Schema(description = "담당자 ID", example = "5")
    @NotNull(message = "담당자를 선택해주세요")
    private Long assigneeId;

    public BulkAssignCommand toCommand() {
        return new BulkAssignCommand(vocIds, assigneeId);
    }
}
