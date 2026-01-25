package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.AssignVocCommand;
import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Use case for assigning VOC to a user
 */
public interface AssignVocUseCase {

    Voc assignVoc(AssignVocCommand command);

    Voc unassignVoc(Long vocId);
}
