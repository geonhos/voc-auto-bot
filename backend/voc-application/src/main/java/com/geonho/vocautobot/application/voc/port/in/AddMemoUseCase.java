package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.AddMemoCommand;
import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Use case for adding a memo to a VOC
 */
public interface AddMemoUseCase {
    /**
     * Add a memo to the VOC
     * @param command memo information
     * @return updated VOC with new memo
     */
    Voc addMemo(AddMemoCommand command);
}
