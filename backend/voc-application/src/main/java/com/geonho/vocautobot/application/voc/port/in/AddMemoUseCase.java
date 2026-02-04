package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.AddMemoCommand;
import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Use case for adding a memo to a VOC
 */
public interface AddMemoUseCase {
    /**
     * Add a memo to the VOC
     * @param command memo information
     * @param requestingUserId ID of the user making the request (for access control)
     * @return updated VOC with new memo
     * @throws com.geonho.vocautobot.application.voc.exception.VocNotFoundException if VOC not found
     * @throws com.geonho.vocautobot.application.voc.exception.VocAccessDeniedException if user has no access
     */
    VocDomain addMemo(AddMemoCommand command, Long requestingUserId);
}
