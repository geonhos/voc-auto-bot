package com.geonho.vocautobot.domain.voc;

import java.util.List;
import java.util.Map;

/**
 * Result of a bulk operation on VOCs.
 * Supports partial failure - some VOCs may succeed while others fail.
 */
public record BulkOperationResult(
        int successCount,
        List<Long> failedIds,
        Map<Long, String> errors
) {
    public int totalCount() {
        return successCount + failedIds.size();
    }
}
