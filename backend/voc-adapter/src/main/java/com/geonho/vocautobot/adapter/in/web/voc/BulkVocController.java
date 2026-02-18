package com.geonho.vocautobot.adapter.in.web.voc;

import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.web.voc.dto.BulkAssignRequest;
import com.geonho.vocautobot.adapter.in.web.voc.dto.BulkOperationResponse;
import com.geonho.vocautobot.adapter.in.web.voc.dto.BulkPriorityChangeRequest;
import com.geonho.vocautobot.adapter.in.web.voc.dto.BulkStatusChangeRequest;
import com.geonho.vocautobot.application.voc.port.in.BulkVocUseCase;
import com.geonho.vocautobot.domain.voc.BulkOperationResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * VOC bulk operations REST controller
 */
@Tag(name = "VOC Bulk Operations", description = "VOC 일괄 작업 API")
@RestController
@RequestMapping("/v1/vocs/batch")
@RequiredArgsConstructor
public class BulkVocController {

    private final BulkVocUseCase bulkVocUseCase;

    @Operation(summary = "일괄 상태 변경", description = "선택한 VOC들의 상태를 일괄 변경합니다")
    @PatchMapping("/status")
    public ApiResponse<BulkOperationResponse> bulkChangeStatus(
            @Valid @RequestBody BulkStatusChangeRequest request
    ) {
        BulkOperationResult result = bulkVocUseCase.bulkChangeStatus(request.toCommand());
        return ApiResponse.success(BulkOperationResponse.from(result));
    }

    @Operation(summary = "일괄 담당자 배정", description = "선택한 VOC들에 담당자를 일괄 배정합니다")
    @PatchMapping("/assign")
    public ApiResponse<BulkOperationResponse> bulkAssign(
            @Valid @RequestBody BulkAssignRequest request
    ) {
        BulkOperationResult result = bulkVocUseCase.bulkAssign(request.toCommand());
        return ApiResponse.success(BulkOperationResponse.from(result));
    }

    @Operation(summary = "일괄 우선순위 변경", description = "선택한 VOC들의 우선순위를 일괄 변경합니다")
    @PatchMapping("/priority")
    public ApiResponse<BulkOperationResponse> bulkChangePriority(
            @Valid @RequestBody BulkPriorityChangeRequest request
    ) {
        BulkOperationResult result = bulkVocUseCase.bulkChangePriority(request.toCommand());
        return ApiResponse.success(BulkOperationResponse.from(result));
    }
}
