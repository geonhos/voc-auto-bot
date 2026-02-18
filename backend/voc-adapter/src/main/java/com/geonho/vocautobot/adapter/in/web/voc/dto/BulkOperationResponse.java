package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.domain.voc.BulkOperationResult;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;

@Schema(description = "벌크 작업 결과 응답")
public record BulkOperationResponse(
        @Schema(description = "성공 건수") int successCount,
        @Schema(description = "실패한 VOC ID 목록") List<Long> failedIds,
        @Schema(description = "에러 상세 (VOC ID → 에러 메시지)") Map<Long, String> errors
) {
    public static BulkOperationResponse from(BulkOperationResult result) {
        return new BulkOperationResponse(
                result.successCount(),
                result.failedIds(),
                result.errors()
        );
    }
}
