package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.BulkAssignCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.BulkPriorityChangeCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.BulkStatusChangeCommand;
import com.geonho.vocautobot.domain.voc.BulkOperationResult;

/**
 * Use case for bulk VOC operations
 */
public interface BulkVocUseCase {

    BulkOperationResult bulkChangeStatus(BulkStatusChangeCommand command);

    BulkOperationResult bulkAssign(BulkAssignCommand command);

    BulkOperationResult bulkChangePriority(BulkPriorityChangeCommand command);
}
