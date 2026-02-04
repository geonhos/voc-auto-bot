package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.AssignVocCommand;
import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Use case for assigning VOC to a user
 */
public interface AssignVocUseCase {

    VocDomain assignVoc(AssignVocCommand command);

    VocDomain unassignVoc(Long vocId);
}
